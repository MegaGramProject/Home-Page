<?php

namespace App\Http\Controllers;

use App\Services\PostBgMusicService;
use App\Services\UserAuthService;
use App\Services\PostVidSubtitlesService;
use App\Services\PostInfoFetchingService;
use App\Services\EncryptionAndDecryptionService;

use App\Models\Oracle\PostBgMusicInfo\UnencryptedPostBgMusicInfo;
use App\Models\Oracle\PostBgMusicInfo\EncryptedPostBgMusicInfo;

use App\Models\Oracle\PostBgMusicAndVidSubtitlesEncryptionInfo;

use App\Models\Cassandra\EncryptedPostVidSubtitlesInfo;

use App\Models\MongoDB_Atlas\ProfilePhoto;

use App\Models\MySQL\User\PublicUser;
use App\Models\MySQL\User\PrivateUser;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;


class BackendController extends Controller {
    protected $postBgMusicService;
    protected $postVidSubtitlesService;

    protected $userAuthService;
    protected $postInfoFetchingService;
    protected $encryptionAndDecryptionService;

    protected $redisClient;
    protected $gcsBgMusicOfPostsBucket;
    protected $s3VidSubtitlesForPostsBucket;

    protected $stringLabelToIntStatusCodeMappings;


    public function __construct(
        PostBgMusicService $postBgMusicService, PostVidSubtitlesService $postVidSubtitlesService,
        UserAuthService $userAuthService, PostInfoFetchingService $postInfoFetchingService,
        EncryptionAndDecryptionService $encryptionAndDecryptionService
    ) {
        $this->postBgMusicService = $postBgMusicService;
        $this->postVidSubtitlesService = $postVidSubtitlesService;

        $this->userAuthService = $userAuthService;
        $this->postInfoFetchingService = $postInfoFetchingService;
        $this->encryptionAndDecryptionService = $encryptionAndDecryptionService;

        $this->redisClient = Redis::connection()->client();
        $this->gcsBgMusicOfPostsBucket = Storage::disk('gcsBgMusicForPostsBucket');
        $this->s3VidSubtitlesForPostsBucket = Storage::disk('s3VidSubtitlesForPostsBucket');

        $this->stringLabelToIntStatusCodeMappings = [
            "UNAUTHORIZED" => 403,
            "BAD_GATEWAY" => 502,
            "NOT_FOUND" => 404,
        ];
    }


    public function getBgMusicOfPost(Request $request, int $authUserId, string $overallPostId) {
        if ($authUserId < 1 && $authUserId !== -1) {
            return response('There does not exist a user with the provided userId. If you are just an anonymous guest,
            you must set the authUserId to -1.', 400);
        }
    
        if (!preg_match('/^[a-f\d]{24}$/i', $overallPostId)) {
            return response('The provided overallPostId is invalid.', 400);
        }

        $authUserIsAnonymousGuest = $authUserId == -1;

        if (!$authUserIsAnonymousGuest) {
            $userAuthenticationResult =  $this->userAuthService->authenticateUser(
                $authUserId, $request
            );

            if (is_bool($userAuthenticationResult)) {
                if (!$userAuthenticationResult) {
                    return response("The expressJSBackend1 server could not verify you as having the proper
                    credentials to be logged in as $authUserId", 403);
                }
            }
            else if (is_string($userAuthenticationResult)) {  
                if ($userAuthenticationResult === 'The provided authUser token, if any, in your cookies has an
                invalid structure.')  {  
                    return response($userAuthenticationResult, 403);  
                }  
                return response($userAuthenticationResult, 502);  
            }  
            else {  
                $refreshedAuthToken = $userAuthenticationResult[0];  
                $expirationDate = $userAuthenticationResult[1];  

                setcookie(
                    "authToken$authUserId",
                    $refreshedAuthToken,
                    $expirationDate,
                    '/',
                    '',
                    true,
                    true
                );
            }  
        }

        $plaintextDataEncryptionKey = [];
        $isEncrypted = false;

        $authorsAndPostEncryptionStatusIfUserHasAccessToPost = $this->postInfoFetchingService->
        getPostEncryptionStatusIfUserHasAccessToPost(
            $authUserId,
            $overallPostId
        );
        if (self::isIndexedArray($authorsAndPostEncryptionStatusIfUserHasAccessToPost)) {
            return response(
                $authorsAndPostEncryptionStatusIfUserHasAccessToPost[0],
                $this->stringLabelToIntStatusCodeMappings[
                    $authorsAndPostEncryptionStatusIfUserHasAccessToPost[1]
                ],
            );  
        }

        $isEncrypted = $authorsAndPostEncryptionStatusIfUserHasAccessToPost;
        if ($isEncrypted) {
            try {
                $plaintextDataEncryptionKey =  $this->encryptionAndDecryptionService->getPlaintextDataEncryptionKeyOfPost(
                    $overallPostId, $this->redisClient, $this->encryptionAndDecryptionService
                );
            }
            catch (\Exception) {
                return response(
                    "There was trouble in the process of obtaining the encryptedDataEncryptionKey and decrypting
                    that in order to decrypt the relevant data of this encrypted post.",
                    502
                );
            }
        }

        $bgMusicAudio = $this->postBgMusicService->getPostsBgMusicIfExistsNullOtherwise(
            $this->gcsBgMusicOfPostsBucket, $overallPostId
        );
        if ($bgMusicAudio==null) {
            return response(
                "The background-music of this post does not exist",
                404
            );
        }
        else if (self::isIndexedArray($bgMusicAudio)) {
            return response(
                $bgMusicAudio[0],
                $this->stringLabelToIntStatusCodeMappings[
                    $bgMusicAudio[1]
                ],
            );  
        }

        $errorMessage = "";

        $postBgMusicInfo = $this->postBgMusicService->getMetadataOfPostsBgMusic(
            $overallPostId, $isEncrypted, $this->redisClient
        );
        if (self::isIndexedArray($postBgMusicInfo)) {
            $postBgMusicInfo = null;
            $errorMessage .= $postBgMusicInfo[0];
        }
        $bgMusicOfPost = [];

        if ($isEncrypted && $postBgMusicInfo !== null) {
            $bgMusicOfPost['audio'] = $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                $bgMusicAudio,
                $plaintextDataEncryptionKey,
                $postBgMusicInfo['audioEncryptionIv'],
                $postBgMusicInfo['audioEncryptionAuthTag']
            );

            $bgMusicOfPost['title'] = $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                $postBgMusicInfo['encryptedTitle'],
                $plaintextDataEncryptionKey,
                $postBgMusicInfo['titleEncryptionIv'],
                $postBgMusicInfo['titleEncryptionAuthTag']
            );

            $bgMusicOfPost['artist'] = $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                $postBgMusicInfo['encryptedArtist'],
                $plaintextDataEncryptionKey,
                $postBgMusicInfo['artistEncryptionIv'],
                $postBgMusicInfo['artistEncryptionAuthTag']
            );
        }
        else if ($postBgMusicInfo !== null) {
            $bgMusicOfPost['audio'] = $bgMusicAudio;
            $bgMusicOfPost['title'] =  $postBgMusicInfo['encryptedArtist'];
            $bgMusicOfPost['artist'] =  $postBgMusicInfo['encryptedArtist'];
        }
        else {
            if ($isEncrypted) {
                return response(
                    'There was trouble decrypting the audio-file of the background-music of this
                    encrypted post',
                    502
                );
            }
            $bgMusicOfPost['audio'] = $bgMusicAudio;
            $bgMusicOfPost['title'] = 'Unknown Title';
            $bgMusicOfPost['artist'] = 'Unknown Artist';
        }

        if ($postBgMusicInfo !== null) {
            $bgMusicOfPost['startTime'] = $postBgMusicInfo['startTime'];
            $bgMusicOfPost['endTime'] = $postBgMusicInfo['endTime'];
        }
        else {
            $bgMusicOfPost['startTime'] = 0;
            $bgMusicOfPost['endTime'] = -1;
        }

        return response()->json([
            'ErrorMessage' => $errorMessage,
            'bgMusicOfPost' => $bgMusicOfPost
        ], 200);
    }


    public function getBgMusicOfMultiplePosts(Request $request) {
        $overallPostIdsAndIfTheyAreEncrypted = $request->input('overallPostIdsAndIfTheyAreEncrypted');

        $setOfOverallPostIdsOfEncryptedPosts = [];
        $setOfOverallPostIdsOfUnencryptedPosts = [];

        foreach (array_keys($overallPostIdsAndIfTheyAreEncrypted) as $overallPostId) {
            if ($overallPostIdsAndIfTheyAreEncrypted[$overallPostId]) {
                $setOfOverallPostIdsOfEncryptedPosts[] = $overallPostId;
            } else {
                $setOfOverallPostIdsOfUnencryptedPosts[] = $overallPostId;
            }
        }

        $errorMessage = "";

        $setOfOverallPostIdsOfUnencryptedPostsThatHaveBgMusic = [];
        $setOfOverallPostIdsOfEncryptedPostsThatHaveBgMusic = [];
        $overallPostIdsAndTheirBgMusic = [];

        if (count($setOfOverallPostIdsOfUnencryptedPosts) > 0) {
            foreach ($setOfOverallPostIdsOfUnencryptedPosts as $overallPostIdOfUnencryptedPost) {
                $bgMusicAudio = $this->postBgMusicService->getPostsBgMusicIfExistsNullOtherwise(
                    $this->gcsBgMusicOfPostsBucket, $overallPostIdOfUnencryptedPost
                );

                if (self::isIndexedArray($bgMusicAudio)) {
                    $errorMessage.= "• " . $bgMusicAudio[0] . "\n";
                }
                else if ($bgMusicAudio !== null) {
                    $setOfOverallPostIdsOfUnencryptedPostsThatHaveBgMusic[] = $overallPostIdOfUnencryptedPost;
                    $overallPostIdsAndTheirBgMusic[$overallPostIdOfUnencryptedPost] = [
                        'src' => $bgMusicAudio,
                        'title' => 'Unknown Title',
                        'artist' =>  'Unknown Artist',
                        'startTime' => 0,
                        'endTime' => -1
                    ];
                }
            }

            if (count($setOfOverallPostIdsOfUnencryptedPostsThatHaveBgMusic) > 0) {
                $resultOfGettingMetadataOfMultiplePosts = $this->postBgMusicService->
                getMetadataOfBgMusicOfMultiplePosts(
                    $setOfOverallPostIdsOfUnencryptedPostsThatHaveBgMusic,
                    false,
                    $this->redisClient
                );

                if (self::isIndexedArray($resultOfGettingMetadataOfMultiplePosts)) {
                    $errorMessage.= '• There was trouble getting the metadata of the background-music of
                    each of the unencrypted posts\n';
                }
                else {
                    foreach($resultOfGettingMetadataOfMultiplePosts as $bgMusicMetadataOfUnencryptedPost) {
                        $overallPostId = $bgMusicMetadataOfUnencryptedPost['overallPostId'];

                        $overallPostIdsAndTheirBgMusic[$overallPostId] = [
                            'src' => $overallPostIdsAndTheirBgMusic[$overallPostId]['src'],
                            'title' => $bgMusicMetadataOfUnencryptedPost['title'],
                            'artist' =>  $bgMusicMetadataOfUnencryptedPost['artist'],
                            'startTime' => $bgMusicMetadataOfUnencryptedPost['startTime'],
                            'endTime' => $bgMusicMetadataOfUnencryptedPost['endTime']
                        ];
                    }
                }
            }
        }

        if (count($setOfOverallPostIdsOfEncryptedPosts) > 0) {
            $overallPostIdsAndTheirPlaintextDataEncryptionKeys = null;

            $canDecryptEachPostsBgMusic = true;

            try {
                $overallPostIdsAndTheirPlaintextDataEncryptionKeys = $this->encryptionAndDecryptionService
                ->getPlaintextDataEncryptionKeysOfMultiplePosts(
                    $setOfOverallPostIdsOfEncryptedPosts,
                    $this->redisClient,
                    $this->encryptionAndDecryptionService
                );
            }
            catch (\Exception) {
                $errorMessage.= '• There was trouble getting the plaintext data-encryption-keys required
                to decrypt the relevant data of each of the posts\n';
                $canDecryptEachPostsBgMusic = false;
            }

            if ($canDecryptEachPostsBgMusic) {
                foreach ($setOfOverallPostIdsOfEncryptedPosts as $overallPostIdOfEncryptedPost) {
                    $bgMusicAudio = $this->postBgMusicService->getPostsBgMusicIfExistsNullOtherwise(
                        $this->gcsBgMusicOfPostsBucket, $overallPostIdOfEncryptedPost
                    );

                    if (self::isIndexedArray($bgMusicAudio)) {
                        $errorMessage.= "• " . $bgMusicAudio[0] . "\n";
                    }
                    else if ($bgMusicAudio !== null) {
                        $setOfOverallPostIdsOfEncryptedPostsThatHaveBgMusic[] = $overallPostIdOfEncryptedPost;
                        $overallPostIdsAndTheirBgMusic[$overallPostIdOfEncryptedPost] = [
                            'src' => $bgMusicAudio
                        ];
                    }
                }
            }

            if (count($setOfOverallPostIdsOfEncryptedPostsThatHaveBgMusic) > 0) {
                $resultOfGettingMetadataOfMultiplePosts = $this->postBgMusicService->
                getMetadataOfBgMusicOfMultiplePosts(
                    $setOfOverallPostIdsOfEncryptedPostsThatHaveBgMusic,
                    true,
                    $this->redisClient
                );

                if (self::isIndexedArray($resultOfGettingMetadataOfMultiplePosts)) {
                    $errorMessage.= '• There was trouble getting the metadata of the background-music of
                    each of the encrypted posts\n';

                    foreach ($setOfOverallPostIdsOfEncryptedPostsThatHaveBgMusic as $keyToRemove) {
                        unset($overallPostIdsAndTheirBgMusic[$keyToRemove]);
                    }
                }
                else {
                    foreach($resultOfGettingMetadataOfMultiplePosts as $bgMusicMetadataOfEncryptedPost) {
                        $overallPostIdOfEncryptedPost = $bgMusicMetadataOfEncryptedPost['overallPostId'];
                        
                        $overallPostIdsAndTheirBgMusic[$overallPostIdOfEncryptedPost]['src'] =
                        $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                            $overallPostIdsAndTheirBgMusic[$overallPostIdOfEncryptedPost]['src'],
                            $overallPostIdsAndTheirPlaintextDataEncryptionKeys[$overallPostIdOfEncryptedPost],
                            $bgMusicMetadataOfEncryptedPost['audioEncryptionIv'],
                            $bgMusicMetadataOfEncryptedPost['audioEncryptionAuthTag']
                        );
    
                        $overallPostIdsAndTheirBgMusic[$overallPostIdOfEncryptedPost]['title'] =
                        $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                            $bgMusicMetadataOfEncryptedPost['encryptedTitle'],
                            $overallPostIdsAndTheirPlaintextDataEncryptionKeys[$overallPostIdOfEncryptedPost],
                            $bgMusicMetadataOfEncryptedPost['titleEncryptionIv'],
                            $bgMusicMetadataOfEncryptedPost['titleEncryptionAuthTag']
                        );
    
                        $overallPostIdsAndTheirBgMusic[$overallPostIdOfEncryptedPost]['artist'] =
                        $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                            $bgMusicMetadataOfEncryptedPost['encryptedArtist'],
                            $overallPostIdsAndTheirPlaintextDataEncryptionKeys[$overallPostIdOfEncryptedPost],
                            $bgMusicMetadataOfEncryptedPost['artistEncryptionIv'],
                            $bgMusicMetadataOfEncryptedPost['artistEncryptionAuthTag']
                        );

                        $overallPostIdsAndTheirBgMusic[$overallPostIdOfEncryptedPost]['startTime'] =
                        $bgMusicMetadataOfEncryptedPost['startTime'];

                        $overallPostIdsAndTheirBgMusic[$overallPostIdOfEncryptedPost]['endTime'] =
                        $bgMusicMetadataOfEncryptedPost['endTime'];
                    }
                }
            }
        }

        return response()->json([
            "overallPostIdsAndTheirBgMusic" => $overallPostIdsAndTheirBgMusic,
            "errorMessage" => $errorMessage
        ], 200);
    }


    public function addBgMusicToPost(string $overallPostId, bool $isEncrypted) {
        $bgMusicAudioFileBuffer = request()->input('bgMusicAudioFile');

        $postBgMusicInfo = $this->postBgMusicService->getMetadataOfPostsBgMusic(
            $overallPostId, $isEncrypted, $this->redisClient
        );
        if (self::isIndexedArray($postBgMusicInfo)) {
            return response(
                "There was trouble checking whether or not the provided post already has background
                -music",
                502
            );
        }
        else if ($postBgMusicInfo !== null) {
            return response("You are trying to add background-music to a post that already has
            background-music", 409);
        }

        $plaintextDataEncryptionKey = [];

        if ($isEncrypted) {
            try {
                $plaintextDataEncryptionKey = $this->encryptionAndDecryptionService->getPlaintextDataEncryptionKeyOfPost(
                    $overallPostId, $this->redisClient, $this->encryptionAndDecryptionService
                );
            }
            catch (\Exception) {
                return response(
                    "There was trouble in the process of obtaining the encryptedDataEncryptionKey and decrypting
                    that in order to encrypt the relevant data of this encrypted post.",
                    502
                );
            }
        }
    
        $postBgMusicInfo = [
            'overallPostId' => $overallPostId,
            'title' => 'Unknown Title',
            'artist' => 'Unknown Artist',
            'startTime' => 0,
            'endTime' => -1
        ];
        $inputTitle = request()->input('title');
        if ($inputTitle !== null) {
            $postBgMusicInfo['title'] = $inputTitle; //50 char limit
        }

        $inputArtist = request()->input('artist');
        if ($inputArtist !== null) {
            $postBgMusicInfo['artist'] = $inputArtist; //30 char limit
        }

        $inputStartTime = request()->input('startTime');
        $inputEndTime = request()->input('endTime');

        if ($inputStartTime !== null && $inputEndTime !== null) {
            $postBgMusicInfo['startTime'] = $inputStartTime;
            $postBgMusicInfo['endTime'] = $inputEndTime;
        }

        $errorMessage = "";

        if ($isEncrypted) {
            $audioEncryptionInfo = $this->encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                $bgMusicAudioFileBuffer, $plaintextDataEncryptionKey
            );
            $encryptedBgMusicAudioFileBuffer = $audioEncryptionInfo[0];

            try {
                $this->gcsBgMusicOfPostsBucket->put(
                    $overallPostId . '.mp3', $encryptedBgMusicAudioFileBuffer
                );
            }
            catch (\Exception) {
                $errorMessage .= "• There was trouble adding the encrypted audio-file into the database.\n";
                return response($errorMessage, 502);
            }

            $postBgMusicInfo['audioEncryptionIv'] = $audioEncryptionInfo[1];
            $postBgMusicInfo['audioEncryptionAuthTag'] = $audioEncryptionInfo[2];

            $titleEncryptionInfo = $this->encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                $postBgMusicInfo['title'], $plaintextDataEncryptionKey
            );
            $postBgMusicInfo['encryptedTitle'] = $titleEncryptionInfo[0];
            $postBgMusicInfo['titleEncryptionIv'] = $titleEncryptionInfo[1];
            $postBgMusicInfo['titleEncryptionAuthTag'] = $titleEncryptionInfo[2];

            $artistEncryptionInfo = $this->encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                $postBgMusicInfo['artist'], $plaintextDataEncryptionKey
            );
            $postBgMusicInfo['encryptedArtist'] = $artistEncryptionInfo[0];
            $postBgMusicInfo['artistEncryptionIv'] = $artistEncryptionInfo[1];
            $postBgMusicInfo['artistEncryptionAuthTag'] = $artistEncryptionInfo[2];

            unset($postBgMusicInfo['title']);
            unset($postBgMusicInfo['artist']);

            try {
                EncryptedPostBgMusicInfo::Create(
                    $postBgMusicInfo
                ); 
            }
            catch (\Exception) {
                $errorMessage .= "• There was trouble adding the encrypted metadata of the post's new background-
                music.\n";
            }
        }
        else {
            try {
                $this->gcsBgMusicOfPostsBucket->put(
                    $overallPostId . '.mp3', $bgMusicAudioFileBuffer
                );
            }
            catch (\Exception) {
                $errorMessage .= "• There was trouble adding the audio-file into the database.\n";
                return response($errorMessage, 502);
            }

            try {
                UnencryptedPostBgMusicInfo::Create(
                    $postBgMusicInfo
                ); 
            }
            catch (\Exception) {
                $errorMessage .= "• There was trouble adding the metadata of the post's new background-
                music.\n";
            } 
        }

        unset($postBgMusicInfo['overallPostId']);
        $postBgMusicInfo['startTime'] = strval($postBgMusicInfo['startTime']);
        $postBgMusicInfo['endTime'] = strval($postBgMusicInfo['endTime']);

        try {
            $this->redisClient->hMSet(
                "bgMusicMetadataForPost$overallPostId",
                $postBgMusicInfo
            );
        }
        catch (\Exception) {
            $errorMessage .= "• There was trouble caching the metadata of the post's newly added
            background-music\n";
        }

        return response()->json([
            'ErrorMessage' => $errorMessage
        ], 200);        
    }


    public function addEncryptionInfoForBgMusicAndVidSubsOfNewlyUploadedEncryptedPost(string $overallPostId) {
        $newCMKWasSuccessfullyCreated = $this->encryptionAndDecryptionService->createNewCustomerMasterKey(
            'bgMusicAndVidSubsOfPosts',
            $overallPostId
        );

        if (!$newCMKWasSuccessfullyCreated) {
            return response(
                'There was trouble creating the new GCP CMK for encrypting the data-encryption-key
                of the vid-subs and background-music of this encrypted post',
                502
            );
        }

        $encryptedDataEncryptionKey = null;
        try {
            $resultOfCreatingAndEncryptingDEK = $this->encryptionAndDecryptionService->
            createAndEncryptNewDataEncryptionKey(
                'bgMusicAndVidSubsOfPosts',
                $overallPostId
            );
            
            $encryptedDataEncryptionKey = $resultOfCreatingAndEncryptingDEK[1];
        }
        catch (\Exception) {
            return response(
                "There was trouble encrypting the newly generated data-encryption-key for the
                vid-subs and background-music of this encrypted post",
                502
            );
        }

        try {
            PostBgMusicAndVidSubtitlesEncryptionInfo::create([
                'overallPostId' => $overallPostId,
                'encryptedDataEncryptionKey' => $encryptedDataEncryptionKey
            ]);
            return response(
                "success",
                201
            );
        }
        catch (\Exception) {
            return response(
                "There was trouble adding the encryption-info into the database",
                502
            );
        }
    }


    public function toggleEncryptionStatusOfBgMusicAndVidSubtitlesOfPost(string $overallPostId, bool $originallyIsEncrypted)
    {
        $errorMessage = '';
        
        if ($originallyIsEncrypted) {
            $plaintextDataEncryptionKey = null;

            try {
                $plaintextDataEncryptionKey =  $this->encryptionAndDecryptionService->getPlaintextDataEncryptionKeyOfPost(
                    $overallPostId, $this->redisClient, $this->encryptionAndDecryptionService
                );
            }
            catch (\Exception) {
                $errorMessage .= '• There was trouble in the process of obtaining the encryptedDataEncryptionKey and
                decrypting that in order to decrypt the encrypted bg-music and vid-subtitles, if any, of this post.\n';
                
                return response(
                    $errorMessage,
                    502
                );
            }

            $encryptedBgMusicOfPost = $this->postBgMusicService->getPostsBgMusicIfExistsNullOtherwise(
                $this->gcsBgMusicOfPostsBucket,
                $overallPostId
            );
            if (self::isIndexedArray($encryptedBgMusicOfPost)) {
                $errorMessage .= "• $encryptedBgMusicOfPost[0]\n";
                return response(
                    $errorMessage,
                    $this->stringLabelToIntStatusCodeMappings[
                        $encryptedBgMusicOfPost[1]
                    ]
                );
            }

            $decryptedBgMusicOfPost = null;
            $decryptedMetadataOfBgMusicOfPost = [
                'overallPostId' => $overallPostId
            ];

            if ($encryptedBgMusicOfPost !== null) {
                $metadataOfBgMusicOfPost = $this->postBgMusicService->getMetadataOfPostsBgMusic(
                    $overallPostId,
                    true,
                    $this->redisClient
                );
                if (self::isIndexedArray($metadataOfBgMusicOfPost)) {
                    $errorMessage .= "• $metadataOfBgMusicOfPost[0]\n";
                    return response(
                        $errorMessage,
                        $this->stringLabelToIntStatusCodeMappings[
                            $metadataOfBgMusicOfPost[1]
                        ]
                    );
                }

                $decryptedBgMusicOfPost = $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                    $encryptedBgMusicOfPost,
                    $plaintextDataEncryptionKey,
                    $metadataOfBgMusicOfPost['audioEncryptionIv'],
                    $metadataOfBgMusicOfPost['audioEncryptionAuthTag']
                );

                $decryptedMetadataOfBgMusicOfPost = [
                    'startTime' => $metadataOfBgMusicOfPost['startTime'],
                    'endTime' => $metadataOfBgMusicOfPost['endTime']
                ];

                $decryptedMetadataOfBgMusicOfPost['title'] = $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                    $metadataOfBgMusicOfPost['encryptedTitle'],
                    $plaintextDataEncryptionKey,
                    $metadataOfBgMusicOfPost['titleEncryptionIv'],
                    $metadataOfBgMusicOfPost['titleEncryptionAuthTag']
                );

                $decryptedMetadataOfBgMusicOfPost['artist'] = $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                    $metadataOfBgMusicOfPost['encryptedArtist'],
                    $plaintextDataEncryptionKey,
                    $metadataOfBgMusicOfPost['artistEncryptionIv'],
                    $metadataOfBgMusicOfPost['artistEncryptionAuthTag']
                );

                try {
                    $this->gcsBgMusicOfPostsBucket->delete($overallPostId . '.mp3');
                }
                catch (\Exception) {
                    $errorMessage .= "• There was trouble deleting the encrypted audio-file from the database\n";
                    return response($errorMessage, 502);
                }

                try {
                    $this->gcsBgMusicOfPostsBucket->put($overallPostId . '.mp3', $decryptedBgMusicOfPost);
                }
                catch (\Exception) {
                    $errorMessage .= "• There was trouble adding the unencrypted audio-file into the database\n";
                    return response($errorMessage, 502);
                }

                try {
                    EncryptedPostBgMusicInfo::where('overallPostId', $overallPostId)->delete();
                }
                catch (\Exception) {
                    $errorMessage .= "• There was trouble deleting this post's encryption bg-music from the database\n";
                    
                    return response(
                        $errorMessage,
                        502
                    );
                }

                try {
                    UnencryptedPostBgMusicInfo::create($decryptedMetadataOfBgMusicOfPost);
                }
                catch (\Exception) {
                    $errorMessage .= "• There was trouble adding this post's unencrypted bg-music into the database\n";
                    
                    return response(
                        $errorMessage,
                        502
                    );
                }

                try {
                    $this->redisClient->del("bgMusicMetadataForPost$overallPostId");
                }
                catch (\Exception) {
                    $errorMessage .= '• There was trouble deleting the caching of the encrypted metadata of the bg-music
                    of this post\n';
                    return response($errorMessage, 502);
                }

                try {
                    $decryptedMetadataOfBgMusicOfPost['startTime'] = strval($decryptedMetadataOfBgMusicOfPost['startTime']);
                    $decryptedMetadataOfBgMusicOfPost['endTime'] = strval($decryptedMetadataOfBgMusicOfPost['endTime']);
                    $this->redisClient->hMSet(
                        "bgMusicMetadataForPost$overallPostId",
                        $decryptedMetadataOfBgMusicOfPost
                    );
                }
                catch (\Exception) {
                    $errorMessage .= '• There was trouble adding the caching of the unencrypted metadata of the bg-music
                    of this post\n';
                }
            }

            try {
                $this->encryptionAndDecryptionService->deleteCustomerMasterKey(
                    'bgMusicAndVidSubsOfPosts',
                    $overallPostId
                );
            }
            catch (\Exception) {
                $errorMessage .= "• There was trouble deleting the Google-Cloud KMS Customer-Master-Key that was used
                to encrypt/decrypt the data-encryption-key that was used for the encryption of the vid-subs and
                bg-music of this post\n";
                
                return response(
                    $errorMessage,
                    502
                );
            }

            try {
                PostBgMusicAndVidSubtitlesEncryptionInfo::where('overallPostId', $overallPostId)->delete();
            }
            catch (\Exception) {
                $errorMessage .= "• There was trouble deleting the encryption-info of the vid-subtitles and bg-music of 
                this post\n";
                
                return response(
                    $errorMessage,
                    502
                );
            }

            try {
                $this->redisClient->hDel(
                    'Posts and their EncryptedDEKs for Bg-Music/Vid-Subs',
                    $overallPostId
                );
            }
            catch (\Exception) {
                $errorMessage .= '• There was trouble deleting the caching of "Posts and their EncryptedDEKS
                for Bg-Music/Vid-Subs" for the this post.\n';
                return response($errorMessage, 502);
            }

            $vidSubtitleFilesOfPost = [];

            try {
                $vidSubtitleFilesOfPost = $this->postVidSubtitlesService->getPostsVidSubtitleFiles(
                    $this->s3VidSubtitlesForPostsBucket,
                    $overallPostId
                );
            }
            catch (\Exception) {
                $errorMessage .= '• There was trouble fetching the encrypted vid-subtitle files of this post.\n';
                return response($errorMessage, 502);
            }

            if (count($vidSubtitleFilesOfPost) > 0) {
                $slideNumberToLangCodeToSubtitlesEncryptionInfo = [];
                $slideNumberToLangCodeToSubtitlesEncryptionInfo = $this->postVidSubtitlesService
                ->getEncryptionInfoOfVidSubtitleFilesOfPost(
                    $this->redisClient,
                    $overallPostId,
                    $vidSubtitleFilesOfPost
                );
                if (self::isIndexedArray($slideNumberToLangCodeToSubtitlesEncryptionInfo)) {
                    return response(
                        $slideNumberToLangCodeToSubtitlesEncryptionInfo[0],
                        $this->stringLabelToIntStatusCodeMappings[
                            $slideNumberToLangCodeToSubtitlesEncryptionInfo[1]
                        ],
                    );  
                }

                try {
                    $this->redisClient->pipeline(function ($pipe) use ($vidSubtitleFilesOfPost, $overallPostId) {
                        foreach ($vidSubtitleFilesOfPost as $vidSubtitlesOfPost) {
                            $slideNumber = $vidSubtitlesOfPost['slideNumber'];
                            $langCode = $vidSubtitlesOfPost['langCode'];
            
                            $pipe->del(
                                "encryptedVidSubtitlesInfoForPost{$overallPostId}@slideNumber{$slideNumber}@langCode{$langCode}"
                            );
                        }
                    });
                }
                catch (\Exception) {
                    $errorMessage .= '• There was trouble deleting the caching of the encrypted vid-subtitles info
                    of each of the vid-subtitles of this post.\n';
                    return response($errorMessage, 502);
                }

                $decryptedVidSubtitlesOfPost = [];
                foreach($vidSubtitleFilesOfPost as $vidSubtitlesInfo) {
                    $slideNumber = $vidSubtitlesInfo['slideNumber'];
                    $langCode = $vidSubtitlesInfo['langCode'];
                    $encryptedSubtitlesFileBuffer = $vidSubtitlesInfo['subtitles'];
                    $subtitlesFileEncryptionIv = $slideNumberToLangCodeToSubtitlesEncryptionInfo[$slideNumber][$langCode]
                    ['iv'];
                    $subtitlesFileEncryptionAuthTag = $slideNumberToLangCodeToSubtitlesEncryptionInfo[$slideNumber][$langCode]
                    ['authTag'];

                    $decryptedSubtitlesFile = $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                        $encryptedSubtitlesFileBuffer,
                        $plaintextDataEncryptionKey,
                        $subtitlesFileEncryptionIv,
                        $subtitlesFileEncryptionAuthTag
                    );

                    if (array_key_exists('isDefault', $vidSubtitlesInfo)) {
                        $decryptedVidSubtitlesOfPost[] = [
                            'isDefault' => true,
                            'slideNumber' => $slideNumber,
                            'langCode' => $langCode,
                            'subtitles' => $decryptedSubtitlesFile
                        ];
                    }
                    else {
                        $decryptedVidSubtitlesOfPost[] = [
                            'slideNumber' => $slideNumber,
                            'langCode' => $langCode,
                            'subtitles' => $decryptedSubtitlesFile
                        ];
                    }
                }

                try {
                    $namesOfVidSubtitleFilesOfAllPosts = $this->s3VidSubtitlesForPostsBucket->files('');

                    $namesOfAllVidSubtitleFilesOfPost = array_filter($namesOfVidSubtitleFilesOfAllPosts, function ($fileName)
                    use ($overallPostId) {
                        return str_starts_with($fileName, $overallPostId);
                    });

                    foreach($namesOfAllVidSubtitleFilesOfPost as $nameOfVidSubtitleFileToDelete) {
                        $this->s3VidSubtitlesForPostsBucket->delete($nameOfVidSubtitleFileToDelete);
                    }
                }
                catch (\Exception) {
                    $errorMessage .= '• There was trouble deleting the encrypted vid-subtitle-files of this post from the
                    database.\n';
                    return response($errorMessage, 502);
                }

                try {
                    foreach($decryptedVidSubtitlesOfPost as $decryptedVidSubtitles) {
                        $decryptedVidSubtitlesFileBuffer = $decryptedVidSubtitles['subtitles'];
                        $slideNumber = $decryptedVidSubtitles['slideNumber'];
                        $langCode = $decryptedVidSubtitles['langCode'];

                        $nameOfUnencryptedVidSubtitlesFileToAdd = "$overallPostId/$slideNumber/$langCode";

                        if (array_key_exists('isDefault', $decryptedVidSubtitles)) {
                            $nameOfUnencryptedVidSubtitlesFileToAdd .= '/default';
                        }

                        $this->s3VidSubtitlesForPostsBucket->put(
                            $nameOfUnencryptedVidSubtitlesFileToAdd,
                            $decryptedVidSubtitlesFileBuffer
                        );
                    }
                }
                catch (\Exception) {
                    $errorMessage .= '• There was trouble adding the now-decrypted vid-subtitle-files of this post into the
                    database.\n';
                    return response($errorMessage, 502);
                }
            }
        }
        else {
            $resultOfCreatingNewCMK = $this->encryptionAndDecryptionService->createNewCustomerMasterKey(
                'bgMusicAndVidSubsOfPosts',
                $overallPostId
            );
            if (!$resultOfCreatingNewCMK) {
                $errorMessage .= '• There was trouble creating a new Google-Cloud KMS Customer-Master-Key
                for encrypting/decrypting the soon to be generated data-encryption-key for encrypting the bg-music
                and vid-subtitles of this post.\n';
                return response($errorMessage, 502);
            }

            $plaintextDataEncryptionKey = null;
            $encryptedDataEncryptionKey = null;

            try {
                $newDEKInfo = $this->encryptionAndDecryptionService->createAndEncryptNewDataEncryptionKey(
                    'bgMusicAndVidSubsOfPosts',
                    $overallPostId
                );
                $plaintextDataEncryptionKey = $newDEKInfo[0];
                $encryptedDataEncryptionKey = $newDEKInfo[0];
            }
            catch (\Exception) {
                $errorMessage .= '• There was trouble in the process of generating and encrypting the new data-encryption-key
                to be used for encrypting the bg-music and vid-subtitles of this post.\n';
                return response($errorMessage, 502);
            }

            try {
                PostBgMusicAndVidSubtitlesEncryptionInfo::create([
                    'overallPostId' => $overallPostId,
                    'encryptedDataEncryptionKey' => $encryptedDataEncryptionKey
                ]);
            }
            catch (\Exception) {
                $errorMessage .= "• There was trouble adding the encryption-info of the vid-subtitles and bg-music of 
                this post\n";
                
                return response(
                    $errorMessage,
                    502
                );
            }

            try {
                $this->redisClient->hSet(
                    'Posts and their EncryptedDEKs for Bg-Music/Vid-Subs',
                    $overallPostId,
                    $encryptedDataEncryptionKey
                );
            }
            catch (\Exception) {
                $errorMessage .= '• There was trouble adding the caching of "Posts and their EncryptedDEKS
                for Bg-Music/Vid-Subs" for the this post.\n';
            }

            $unencryptedBgMusicOfPost = $this->postBgMusicService->getPostsBgMusicIfExistsNullOtherwise(
                $this->gcsBgMusicOfPostsBucket,
                $overallPostId
            );
            if (self::isIndexedArray($unencryptedBgMusicOfPost)) {
                $errorMessage .= "• $unencryptedBgMusicOfPost[0]\n";
                return response(
                    $errorMessage,
                    $this->stringLabelToIntStatusCodeMappings[
                        $unencryptedBgMusicOfPost[1]
                    ]
                );
            }

            $encryptedBgMusicOfPost = null;
            $encryptedMetadataOfBgMusicOfPost = [
                'overallPostId' => $overallPostId
            ];

            if ($unencryptedBgMusicOfPost !== null) {
                $metadataOfBgMusicOfPost = $this->postBgMusicService->getMetadataOfPostsBgMusic(
                    $overallPostId,
                    false,
                    $this->redisClient
                );
                if (self::isIndexedArray($metadataOfBgMusicOfPost)) {
                    $errorMessage .= "• $metadataOfBgMusicOfPost[0]\n";
                    return response(
                        $errorMessage,
                        $this->stringLabelToIntStatusCodeMappings[
                            $metadataOfBgMusicOfPost[1]
                        ]
                    );
                }

                $encryptedMetadataOfBgMusicOfPost = [
                    'startTime' => $metadataOfBgMusicOfPost['startTime'],
                    'endTime' => $metadataOfBgMusicOfPost['endTime']
                ];

                $bgMusicOfPostEncryptionInfo = $this->encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                    $unencryptedBgMusicOfPost,
                    $plaintextDataEncryptionKey,
                );
                $encryptedBgMusicOfPost = $bgMusicOfPostEncryptionInfo[0];
                $encryptedMetadataOfBgMusicOfPost['audioEncryptionIv'] = $bgMusicOfPostEncryptionInfo[1];
                $encryptedMetadataOfBgMusicOfPost['audioEncryptionAuthTag'] = $bgMusicOfPostEncryptionInfo[2];

                $bgMusicTitleEncryptionInfo = $this->encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                    $metadataOfBgMusicOfPost['title'],
                    $plaintextDataEncryptionKey,
                );
                $encryptedMetadataOfBgMusicOfPost['encryptedTitle'] = $bgMusicTitleEncryptionInfo[0];
                $encryptedMetadataOfBgMusicOfPost['titleEncryptionIv'] = $bgMusicTitleEncryptionInfo[1];
                $encryptedMetadataOfBgMusicOfPost['titleEncryptionAuthTag'] = $bgMusicTitleEncryptionInfo[2];

                $bgMusicArtistEncryptionInfo = $this->encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                    $metadataOfBgMusicOfPost['artist'],
                    $plaintextDataEncryptionKey,
                );
                $encryptedMetadataOfBgMusicOfPost['encryptedArtist'] = $bgMusicArtistEncryptionInfo[0];
                $encryptedMetadataOfBgMusicOfPost['artistEncryptionIv'] = $bgMusicArtistEncryptionInfo[1];
                $encryptedMetadataOfBgMusicOfPost['artistEncryptionAuthTag'] = $bgMusicArtistEncryptionInfo[2];

                try {
                    $this->gcsBgMusicOfPostsBucket->delete($overallPostId . '.mp3');
                }
                catch (\Exception) {
                    $errorMessage .= "• There was trouble deleting the unencrypted audio-file from the database\n";
                    return response($errorMessage, 502);
                }

                try {
                    $this->gcsBgMusicOfPostsBucket->put($overallPostId . '.mp3', $encryptedBgMusicOfPost);
                }
                catch (\Exception) {
                    $errorMessage .= "• There was trouble adding the encrypted audio-file into the database\n";
                    return response($errorMessage, 502);
                }

                try {
                    UnencryptedPostBgMusicInfo::where('overallPostId', $overallPostId)->delete();
                }
                catch (\Exception) {
                    $errorMessage .= "• There was trouble deleting this post's unencrypted bg-music from the database\n";
                    
                    return response(
                        $errorMessage,
                        502
                    );
                }

                try {
                    EncryptedPostBgMusicInfo::create($encryptedMetadataOfBgMusicOfPost);
                }
                catch (\Exception) {
                    $errorMessage .= "• There was trouble adding the encryption-info of this post's bg-music into the
                    database\n";
                    
                    return response(
                        $errorMessage,
                        502
                    );
                }

                try {
                    $this->redisClient->del("bgMusicMetadataForPost$overallPostId");
                }
                catch (\Exception) {
                    $errorMessage .= '• There was trouble deleting the caching of the unencrypted metadata of the bg-music
                    of this post\n';
                    return response($errorMessage, 502);
                }

                try {
                    $encryptedMetadataOfBgMusicOfPost['startTime'] = strval($encryptedMetadataOfBgMusicOfPost['startTime']);
                    $encryptedMetadataOfBgMusicOfPost['endTime'] = strval($encryptedMetadataOfBgMusicOfPost['endTime']);
                    $this->redisClient->hMSet(
                        "bgMusicMetadataForPost$overallPostId",
                        $encryptedMetadataOfBgMusicOfPost
                    );
                }
                catch (\Exception) {
                    $errorMessage .= '• There was trouble adding the caching of the encrypted metadata of the bg-music
                    of this post\n';
                }
            }

            $vidSubtitleFilesOfPost = [];

            try {
                $vidSubtitleFilesOfPost = $this->postVidSubtitlesService->getPostsVidSubtitleFiles(
                    $this->s3VidSubtitlesForPostsBucket,
                    $overallPostId
                );
            }
            catch (\Exception) {
                $errorMessage .= '• There was trouble fetching the unencrypted vid-subtitle files of this post.\n';
                return response($errorMessage, 502);
            }

            if (count($vidSubtitleFilesOfPost) > 0) {
                $encryptedVidSubtitlesOfPost = [];
                foreach($vidSubtitleFilesOfPost as $vidSubtitlesInfo) {
                    $slideNumber = $vidSubtitlesInfo['slideNumber'];
                    $langCode = $vidSubtitlesInfo['langCode'];
                    $subtitlesFileBuffer = $vidSubtitlesInfo['subtitles'];

                    $subtitlesFileEncryptionInfo = $this->encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                        $subtitlesFileBuffer,
                        $plaintextDataEncryptionKey,
                    );
                    $encryptedSubtitlesFileBuffer = $subtitlesFileEncryptionInfo[0];
                    $subtitlesFileEncryptionIv = $subtitlesFileEncryptionInfo[1];
                    $subtitlesFileEncryptionAuthTag = $subtitlesFileEncryptionInfo[1];

                    if (array_key_exists('isDefault', $vidSubtitlesInfo)) {
                        $encryptedVidSubtitlesOfPost[] = [
                            'isDefault' => true,
                            'slideNumber' => $slideNumber,
                            'langCode' => $langCode,
                            'subtitles' => $encryptedSubtitlesFileBuffer,
                            'fileEncryptionIv' => $subtitlesFileEncryptionIv,
                            'fileEncryptionAuthTag' => $subtitlesFileEncryptionAuthTag
                        ];
                    }
                    else {
                        $encryptedVidSubtitlesOfPost[] = [
                            'slideNumber' => $slideNumber,
                            'langCode' => $langCode,
                            'subtitles' => $encryptedSubtitlesFileBuffer,
                            'fileEncryptionIv' => $subtitlesFileEncryptionIv,
                            'fileEncryptionAuthTag' => $subtitlesFileEncryptionAuthTag
                        ];
                    }
                }

                try {
                    $namesOfVidSubtitleFilesOfAllPosts = $this->s3VidSubtitlesForPostsBucket->files('');

                    $namesOfAllVidSubtitleFilesOfPost = array_filter($namesOfVidSubtitleFilesOfAllPosts, function ($fileName)
                    use ($overallPostId) {
                        return str_starts_with($fileName, $overallPostId);
                    });

                    foreach($namesOfAllVidSubtitleFilesOfPost as $nameOfVidSubtitleFileToDelete) {
                        $this->s3VidSubtitlesForPostsBucket->delete($nameOfVidSubtitleFileToDelete);
                    }
                }
                catch (\Exception) {
                    $errorMessage .= '• There was trouble deleting the unencrypted vid-subtitle-files of this post from the
                    database.\n';
                    return response($errorMessage, 502);
                }

                try {
                    foreach($encryptedVidSubtitlesOfPost as $encryptedVidSubtitles) {
                        $encryptedVidSubtitlesFileBuffer = $encryptedVidSubtitles['subtitles'];
                        $slideNumber = $encryptedVidSubtitles['slideNumber'];
                        $langCode = $encryptedVidSubtitles['langCode'];

                        $nameOfEncryptedVidSubtitlesFileToAdd = "$overallPostId/$slideNumber/$langCode";

                        if (array_key_exists('isDefault', $encryptedVidSubtitles)) {
                            $nameOfEncryptedVidSubtitlesFileToAdd .= '/default';
                        }

                        $this->s3VidSubtitlesForPostsBucket->put(
                            $nameOfEncryptedVidSubtitlesFileToAdd,
                            $encryptedVidSubtitlesFileBuffer
                        );
                    }
                }
                catch (\Exception) {
                    $errorMessage .= '• There was trouble adding the now-encrypted vid-subtitle-files of this post into the
                    database\n';
                    return response($errorMessage, 502);
                }

                $encryptedPostVidSubtitlesInfoToInsert = [];

                foreach($encryptedVidSubtitlesOfPost as $encryptedVidSubtitles) {
                    $encryptedVidSubtitlesFileBuffer = $encryptedVidSubtitles['subtitles'];
                    $slideNumber = $encryptedVidSubtitles['slideNumber'];
                    $langCode = $encryptedVidSubtitles['langCode'];
                    $fileEncryptionIv = $encryptedVidSubtitles['fileEncryptionIv'];
                    $fileEncryptionAuthTag = $encryptedVidSubtitles['fileEncryptionAuthTag'];

                    $encryptedPostVidSubtitlesInfoToInsert[] = [
                        'overallPostId' => $overallPostId,
                        'slideNumber' => $slideNumber,
                        'langCode' => $langCode,

                        'fileEncryptionIv' => $fileEncryptionIv,
                        'fileEncryptionAuthTag' => $fileEncryptionAuthTag,
                    ];
                }

                try {
                    EncryptedPostVidSubtitlesInfo::insert($encryptedPostVidSubtitlesInfoToInsert);
                }
                catch (\Exception) {
                    $errorMessage .= '• There was trouble adding the encryption-info of all the now-encrypted vid-subtitle
                    files of this post into the database\n';
                    return response($errorMessage, 502);
                }

                try {
                   $this->redisClient->pipeline(function ($pipe) use ($encryptedPostVidSubtitlesInfoToInsert, $overallPostId) {
                    foreach ($encryptedPostVidSubtitlesInfoToInsert as $encryptedPostVidSubtitlesInfo) {
                        $slideNumber = $encryptedPostVidSubtitlesInfo['slideNumber'];
                        $langCode = $encryptedPostVidSubtitlesInfo['langCode'];
                        $fileEncryptionIv = $encryptedPostVidSubtitlesInfo['fileEncryptionIv'];
                        $fileEncryptionAuthTag = $encryptedPostVidSubtitlesInfo['fileEncryptionAuthTag'];
        
                        $pipe->hMSet(
                            "encryptedVidSubtitlesInfoForPost{$overallPostId}@slideNumber{$slideNumber}@langCode{$langCode}",
                            [
                                'fileEncryptionIv' => $fileEncryptionIv,
                                'fileEncryptionAuthTag' => $fileEncryptionAuthTag,
                            ]
                        );
                    }
                });
                }
                catch (\Exception) {
                    $errorMessage .= '• There was trouble adding to the cache the encryption-info of each of the now-
                    encrypted vid-subtitle files of this post\n';
                }
            }
        }

        return response($errorMessage, 200);
    }


    public function updateBgMusicOfPost(string $overallPostId, bool $isEncrypted) {
        $bgMusicAudioFile = request()->file('bgMusicAudioFile');
        $bgMusicAudioFileBuffer = null;
        if ($bgMusicAudioFile !== null) {
            $bgMusicAudioFileBuffer = file_get_contents($bgMusicAudioFile->getRealPath());
        }

        $plaintextDataEncryptionKey = [];

        $postBgMusicInfo = $this->postBgMusicService->getMetadataOfPostsBgMusic(
            $overallPostId, $isEncrypted, $this->redisClient
        );
        if (self::isIndexedArray($postBgMusicInfo)) {
            return response(
                "There was trouble checking whether or not the provided post already has background
                -music",
                502
            );
        }
        else if ($postBgMusicInfo == null) {
            return response("No background-music exists in the post for you to update", 404);
        }

        if ($isEncrypted) {
            try {
                $plaintextDataEncryptionKey =  $this->encryptionAndDecryptionService->getPlaintextDataEncryptionKeyOfPost(
                    $overallPostId, $this->redisClient, $this->encryptionAndDecryptionService
                );
            }
            catch (\Exception) {
                return response(
                    "There was trouble in the process of obtaining the encryptedDataEncryptionKey and decrypting
                    that in order to encrypt the updated data of this encrypted post.",
                    502
                );
            }
        }
    
        $postBgMusicInfo = [];

        $inputTitle = request()->input('title');
        if ($inputTitle !== null) {
            $postBgMusicInfo['title'] = $inputTitle; //50 char limit
        }

        $inputArtist = request()->input('artist');
        if ($inputArtist !== null) {
            $postBgMusicInfo['artist'] = $inputArtist; //30 char limit
        }

        $inputStartTime = request()->input('startTime');
        $inputEndTime = request()->input('endTime');

        if ($inputStartTime !== null && $inputEndTime !== null) {
            $postBgMusicInfo['startTime'] = $inputStartTime;
            $postBgMusicInfo['endTime'] = $inputEndTime;
        }

        $errorMessage = "";

        if ($isEncrypted) {
            $bgMusicWasUpdatedSuccessfully = false;
            $audioEncryptionInfo = null;

            if ($bgMusicAudioFileBuffer !== null) {
                $audioEncryptionInfo = $this->encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                    $bgMusicAudioFileBuffer, $plaintextDataEncryptionKey
                );
                $encryptedBgMusicAudioFileBuffer = $audioEncryptionInfo[0];
    
                try {
                    $this->gcsBgMusicOfPostsBucket->put(
                        $overallPostId . '.mp3', $encryptedBgMusicAudioFileBuffer
                    );
                    $bgMusicWasUpdatedSuccessfully = true;
                }
                catch (\Exception) {
                    $errorMessage .= "• There was trouble updating the audio-file of the post's background
                    -music.\n";
                }
            }

            if ($bgMusicWasUpdatedSuccessfully) {
                $postBgMusicInfo['audioEncryptionIv'] = $audioEncryptionInfo[1];
                $postBgMusicInfo['audioEncryptionAuthTag'] = $audioEncryptionInfo[2];
            }

            if (array_key_exists('title', $postBgMusicInfo)) {
                $titleEncryptionInfo = $this->encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                    $postBgMusicInfo['title'], $plaintextDataEncryptionKey
                );
                $postBgMusicInfo['encryptedTitle'] = $titleEncryptionInfo[0];
                $postBgMusicInfo['titleEncryptionIv'] = $titleEncryptionInfo[1];
                $postBgMusicInfo['titleEncryptionAuthTag'] = $titleEncryptionInfo[2];
                unset($postBgMusicInfo['title']);
            }

            if (array_key_exists('artist', $postBgMusicInfo)) {
                $artistEncryptionInfo = $this->encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                    $postBgMusicInfo['artist'], $plaintextDataEncryptionKey
                );
                $postBgMusicInfo['encryptedArtist'] = $artistEncryptionInfo[0];
                $postBgMusicInfo['artistEncryptionIv'] = $artistEncryptionInfo[1];
                $postBgMusicInfo['artistEncryptionAuthTag'] = $artistEncryptionInfo[2];
                unset($postBgMusicInfo['artist']);
            }

            try {
                EncryptedPostBgMusicInfo
                    ::where('overallPostId', $overallPostId)
                    ->update($postBgMusicInfo);
            }
            catch (\Exception) {
                $errorMessage .= "• There was trouble updating the metadata of the post's background-
                music.\n";
                if ($bgMusicWasUpdatedSuccessfully) {
                    return response($errorMessage, 502);
                }
            }
        }
        else {
            if ($bgMusicAudioFileBuffer !== null) {
                try {
                    $this->gcsBgMusicOfPostsBucket->put(
                        $overallPostId . '.mp3', $bgMusicAudioFileBuffer
                    );
                }
                catch (\Exception) {
                    $errorMessage .= "• There was trouble updating the audio-file of the background-music of the
                    post.\n";
                }
            }

            try {
                UnencryptedPostBgMusicInfo
                    ::where('overallPostId', $overallPostId)
                    ->update($postBgMusicInfo);
            }
            catch (\Exception) {
                $errorMessage .= "• There was trouble updating the metadata of the post's background-
                music.\n";
            } 
        }

        try {
            $this->redisClient->del("bgMusicMetadataForPost$overallPostId");
        }
        catch (\Exception) {
            $errorMessage .= '• There was trouble deleting the original bgMusic-metadata from the
            cache.\n';
            return response($errorMessage, 502);

        }

        return response()->json([
            'ErrorMessage' => $errorMessage
        ], 200);
    }


    public function removeBgMusicFromPost(string $overallPostId, bool $isEncrypted) {
        $audioFileNameToDelete = $overallPostId . '.mp3';

        try {
            if ($this->gcsBgMusicOfPostsBucket->exists($audioFileNameToDelete)) {
                //pass
            }
            else {
                return false;
            }
        }
        catch (\Exception) {
            //pass
        }

        try {
            $this->gcsBgMusicOfPostsBucket->delete($audioFileNameToDelete);
        }
        catch (\Exception) {
            return response('There was trouble deleting the audio-file from the database', 502);
        }

        if ($isEncrypted) {
            try {
                $numRowsDeleted = EncryptedPostBgMusicInfo
                    ::where('overallPostId', $overallPostId)
                    ->delete();
        
                return response()->json($numRowsDeleted==1, 200);
            }
            catch (\Exception) {
                return response('There was trouble deleting the encrypted background-music metadata from
                the database', 502);
            }
        }
        else {
            try {
                $numRowsDeleted = UnencryptedPostBgMusicInfo
                    ::where('overallPostId', $overallPostId)
                    ->delete();
        
                return response()->json($numRowsDeleted==1, 200);
            }
            catch (\Exception) {
                return response('There was trouble deleting the unencrypted background-music metadata
                from the database.', 502);
            }
        }

        try {
            $this->redisClient->del("bgMusicMetadataForPost$overallPostId");
        }
        catch (\Exception) {
            return response('There was trouble deleting the post\'s cached bg-music Metadata.', 502);
        }

        return response()->json(true, 200);
    }


    public function getVidSubtitlesOfPost(Request $request, int $authUserId, string $overallPostId) {
        if ($authUserId < 1 && $authUserId !== -1) {
            return response('There does not exist a user with the provided userId. If you are just an anonymous guest,
            you must set the authUserId to -1.', 400);
        }
    
        if (!preg_match('/^[a-f\d]{24}$/i', $overallPostId)) {
            return response('The provided overallPostId is invalid.', 400);
        }

        $authUserIsAnonymousGuest = $authUserId == -1;

        if (!$authUserIsAnonymousGuest) {
            $userAuthenticationResult =  $this->userAuthService->authenticateUser(
                $authUserId, $request
            );

            if (is_bool($userAuthenticationResult)) {
                if (!$userAuthenticationResult) {
                    return response("The expressJSBackend1 server could not verify you as having the proper
                    credentials to be logged in as $authUserId", 403);
                }
            }
            else if (is_string($userAuthenticationResult)) {  
                if ($userAuthenticationResult === 'The provided authUser token, if any, in your cookies has an
                invalid structure.')  {  
                    return response($userAuthenticationResult, 403);  
                }  
                return response($userAuthenticationResult, 502);  
            }  
            else {  
                $refreshedAuthToken = $userAuthenticationResult[0];  
                $expirationDate = $userAuthenticationResult[1];  

                setcookie(
                    "authToken$authUserId",
                    $refreshedAuthToken,
                    $expirationDate,
                    '/',
                    '',
                    true,
                    true
                );
            }  
        }

        $plaintextDataEncryptionKey = [];
        $isEncrypted = false;

        $authorsAndPostEncryptionStatusIfUserHasAccessToPost = $this->postInfoFetchingService->
        getPostEncryptionStatusIfUserHasAccessToPost(
            $authUserId,
            $overallPostId
        );
        if (self::isIndexedArray($authorsAndPostEncryptionStatusIfUserHasAccessToPost)) {
            return response(
                $authorsAndPostEncryptionStatusIfUserHasAccessToPost[0],
                $this->stringLabelToIntStatusCodeMappings[
                    $authorsAndPostEncryptionStatusIfUserHasAccessToPost[1]
                ],
            );  
        }

        $isEncrypted = $authorsAndPostEncryptionStatusIfUserHasAccessToPost;
        if ($isEncrypted) {
            try {
                $plaintextDataEncryptionKey = $this->encryptionAndDecryptionService->getPlaintextDataEncryptionKeyOfPost(
                    $overallPostId, $this->redisClient, $this->encryptionAndDecryptionService
                );
            }
            catch (\Exception) {
                return response(
                    "There was trouble in the process of obtaining the encryptedDataEncryptionKey and decrypting
                    that in order to decrypt the relevant data of this encrypted post.",
                    502
                );
            }
        }

        $allVidSubtitlesOfPost = $this->postVidSubtitlesService->getPostsVidSubtitleFiles(
            $this->s3VidSubtitlesForPostsBucket, $overallPostId
        );
        if (count($allVidSubtitlesOfPost) == 0) {
            return response(
                "The vid-subtitle files of this post do not exist",
                404
            );
        }
        else if (is_string($allVidSubtitlesOfPost[0])) {
            return response(
                $allVidSubtitlesOfPost[0],
                $this->stringLabelToIntStatusCodeMappings[
                    $allVidSubtitlesOfPost[1]
                ],
            );  
        }

        if ($isEncrypted) {
            $encryptionInfoOfEachSubtitleFileOfPostAsOrganizedDict =
            $this->postVidSubtitlesService->getEncryptionInfoOfVidSubtitleFilesOfPost(
                $this->redisClient,
                $overallPostId,
                $allVidSubtitlesOfPost
            );
            if (self::isIndexedArray($encryptionInfoOfEachSubtitleFileOfPostAsOrganizedDict)) {
                return response(
                    $encryptionInfoOfEachSubtitleFileOfPostAsOrganizedDict[0],
                    $this->stringLabelToIntStatusCodeMappings[
                        $encryptionInfoOfEachSubtitleFileOfPostAsOrganizedDict[1]
                    ],
                );  
            }

            for ($i=0; $i<count($allVidSubtitlesOfPost); $i++) {
                $slideNumber = $allVidSubtitlesOfPost[$i]['slideNumber'];
                $langCode = $allVidSubtitlesOfPost[$i]['langCode'];
                $encryptedSubtitlesFileBuffer = $allVidSubtitlesOfPost[$i]['subtitles'];
                
                $fileEncryptionIv = $encryptionInfoOfEachSubtitleFileOfPostAsOrganizedDict[$slideNumber]
                [$langCode]['fileEncryptionIv'];
                $fileEncryptionAuthTag = $encryptionInfoOfEachSubtitleFileOfPostAsOrganizedDict[$slideNumber]
                [$langCode]['fileEncryptionAuthTag'];

                $allVidSubtitlesOfPost[$i]['subtitles'] = $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                    $encryptedSubtitlesFileBuffer,
                    $plaintextDataEncryptionKey,
                    $fileEncryptionIv,
                    $fileEncryptionAuthTag
                );
            }
        }

        return response()->json($allVidSubtitlesOfPost, 200);
    }

    public function getVidSubtitlesOfMultiplePosts(Request $request) {
        $overallPostIdsAndIfTheyAreEncrypted = $request->input('overallPostIdsAndIfTheyAreEncrypted');

        $setOfOverallPostIdsOfEncryptedPosts = [];
        $overallPostIds = array_keys($overallPostIdsAndIfTheyAreEncrypted);

        foreach ($overallPostIds as $overallPostId) {
            if ($overallPostIdsAndIfTheyAreEncrypted[$overallPostId]) {
                $setOfOverallPostIdsOfEncryptedPosts[] = $overallPostId;
            }
        }

        $namesOfVidSubtitleFilesOfAllPostsInQuestion = [];
        try {
            $namesOfVidSubtitleFilesOfAllPosts = $this->s3VidSubtitlesForPostsBucket->files('');

            $namesOfVidSubtitleFilesOfAllPostsInQuestion = array_filter($namesOfVidSubtitleFilesOfAllPosts,
            function ($fileName) use ($overallPostIds) {
                foreach ($overallPostIds as $overallPostId) {
                    if (str_starts_with($fileName, (string) $overallPostId)) {
                        return true;
                    }
                }
                return false;
            });

            if (count($namesOfVidSubtitleFilesOfAllPostsInQuestion) == 0) {
                return response(
                    "The vid-subtitle files of the list of posts do not exist",
                    404
                );
            }
        }
        catch (\Exception) {
            return response(
                "There was trouble fetching the file-names of all the subtitle-files, if any, of the video-slides of 
                the posts in the list",
                502
            );
        }

        $overallPostIdsAndTheirVidSubtitles = $this->postVidSubtitlesService->getVidSubtitleFilesOfMultiplePosts(
            $namesOfVidSubtitleFilesOfAllPostsInQuestion,
            $this->s3VidSubtitlesForPostsBucket
        );
        if (self::isIndexedArray($overallPostIdsAndTheirVidSubtitles)) {
            return response(
                $overallPostIdsAndTheirVidSubtitles[0],
                $this->stringLabelToIntStatusCodeMappings[
                    $overallPostIdsAndTheirVidSubtitles[1]
                ],
            );
        }

        $errorMessage = "";

        if (count($setOfOverallPostIdsOfEncryptedPosts) > 0) {
            $canDecryptEachOfTheEncryptedSubtitleFiles = true;
            $overallPostIdsAndTheirPlaintextDataEncryptionKeys = null;

            try {
                $overallPostIdsAndTheirPlaintextDataEncryptionKeys = $this->encryptionAndDecryptionService
                ->getPlaintextDataEncryptionKeysOfMultiplePosts(
                    $setOfOverallPostIdsOfEncryptedPosts,
                    $this->redisClient,
                    $this->encryptionAndDecryptionService
                );
            }
            catch (\Exception) {
                $errorMessage.= '• There was trouble getting the plaintext data-encryption-keys required
                to decrypt the relevant data of each of the posts\n';
                $canDecryptEachOfTheEncryptedSubtitleFiles = false;
            }

            if ($canDecryptEachOfTheEncryptedSubtitleFiles) {
                $overallPostIdsAndTheirVidSubtitlesEncryptionInfo = $this->postVidSubtitlesService
                ->getEncryptionInfoOfVidSubtitleFilesOfMultiplePosts(
                    $this->redisClient,
                    $setOfOverallPostIdsOfEncryptedPosts,
                    $overallPostIdsAndTheirVidSubtitles
                );
                if (self::isIndexedArray($overallPostIdsAndTheirVidSubtitlesEncryptionInfo)) {
                    $errorMessage .= $overallPostIdsAndTheirVidSubtitlesEncryptionInfo[0];
                    $canDecryptEachOfTheEncryptedSubtitleFiles = false;
                }
            }

            if ($canDecryptEachOfTheEncryptedSubtitleFiles) {
                foreach($setOfOverallPostIdsOfEncryptedPosts as $overallPostIdOfEncryptedPost) {
                    $allVidSubtitlesOfPost = $overallPostIdsAndTheirVidSubtitles[$overallPostIdOfEncryptedPost];
                    
                    for ($i=0; $i<count($allVidSubtitlesOfPost); $i++) {
                        $vidSubtitlesOfPost = $allVidSubtitlesOfPost[$i];
                        $slideNumber = $vidSubtitlesOfPost['slideNumber'];
                        $langCode = $vidSubtitlesOfPost['langCode'];
    
                        $plaintextDataEncryptionKey = $overallPostIdsAndTheirPlaintextDataEncryptionKeys[$overallPostIdOfEncryptedPost];
                       
                        $fileEncryptionIv = $overallPostIdsAndTheirVidSubtitlesEncryptionInfo[$slideNumber][$langCode]
                        ['fileEncryptionIv'];
                        $fileEncryptionAuthTag = $overallPostIdsAndTheirVidSubtitlesEncryptionInfo[$slideNumber][$langCode]
                        ['fileEncryptionAuthTag'];
    
                        $vidSubtitlesOfPost['subtitles'] = $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                            $vidSubtitlesOfPost['subtitles'],
                            $plaintextDataEncryptionKey,
                            $fileEncryptionIv,
                            $fileEncryptionAuthTag
                        );
                        $allVidSubtitlesOfPost[$i] = $vidSubtitlesOfPost;
                    }

                    $overallPostIdsAndTheirVidSubtitles[$overallPostIdOfEncryptedPost] = $allVidSubtitlesOfPost;
                }
            }
        }

        return response()->json([
            'overallPostIdsAndTheirVidSubtitles' => $overallPostIdsAndTheirVidSubtitles,
            'ErrorMessage' => $errorMessage
        ], 200);
    }

    
    public function addVidSubtitleFilesToPost(Request $request, string $overallPostId, bool $isEncrypted) {
        $plaintextDataEncryptionKey = null;

        if ($isEncrypted) {
            try {
                $plaintextDataEncryptionKey =  $this->encryptionAndDecryptionService->getPlaintextDataEncryptionKeyOfPost(
                    $overallPostId, $this->redisClient, $this->encryptionAndDecryptionService
                );
            }
            catch (\Exception) {
                return response(
                    "There was trouble in the process of obtaining the encryptedDataEncryptionKey and decrypting
                    that in order to encrypt the relevant data of this encrypted post.",
                    502
                );
            }
        }

        $rudimentaryInfoOnVidSubtitlesOfPost = $this->postVidSubtitlesService->getRudimentaryInfoOnVidSubtitlesOfPost(
            $overallPostId,
            $this->s3VidSubtitlesForPostsBucket
        );
        if (is_string($rudimentaryInfoOnVidSubtitlesOfPost[0])) {
            return response(
                $rudimentaryInfoOnVidSubtitlesOfPost[0],
                $this->stringLabelToIntStatusCodeMappings[
                    $rudimentaryInfoOnVidSubtitlesOfPost[1]
                ]
            );
        }

        $subtitleFilesToRemove = [];
        $slideNumbersAndTheirLangCodesToUnsetDefault = [];
        $slideNumbersAndTheirNewDefaultLangCodes = [];
        $slideNumbersToLangCodesToNewSubtitleFileMappings = [];
        $vidSubtitleFilesToAdd = $request->input('vidSubtitleFilesToAdd');

        foreach ($vidSubtitleFilesToAdd as $vidSubtitlesFile) {
            $slideNumber = $vidSubtitlesFile['slideNumber'];
            $langCode = $vidSubtitlesFile['langCode'];
            $isDefault = array_key_exists('isDefault', $vidSubtitlesFile);
            $fileBuffer = $vidSubtitlesFile['subtitles'];

            $defaultSubtitleFileWasRemovedForThis = false;

            if (array_key_exists($slideNumber, $rudimentaryInfoOnVidSubtitlesOfPost) &&
            array_key_exists($langCode, $rudimentaryInfoOnVidSubtitlesOfPost[$slideNumber])) {
                $infoOnSubtitleFileToRemove = [
                    'slideNumber' => $slideNumber,
                    'langCode' => $langCode,
                    'wasDefault' => false
                ];
                
                if ($rudimentaryInfoOnVidSubtitlesOfPost[$slideNumber]['isDefault'] === $langCode) {
                    $defaultSubtitleFileWasRemovedForThis = true;
                    $infoOnSubtitleFileToRemove['wasDefault'] = true;
                }
                $subtitleFilesToRemove[] = $infoOnSubtitleFileToRemove;
            }

            if ($isDefault) {
                if (!$defaultSubtitleFileWasRemovedForThis && array_key_exists($slideNumber,
                $rudimentaryInfoOnVidSubtitlesOfPost) && $rudimentaryInfoOnVidSubtitlesOfPost[$slideNumber]['isDefault'] !== 
                null) {
                    $slideNumbersAndTheirLangCodesToUnsetDefault[$slideNumber] = $rudimentaryInfoOnVidSubtitlesOfPost
                    [$slideNumber]['isDefault'];
                }
                $slideNumbersAndTheirNewDefaultLangCodes[$slideNumber] = $langCode;
            }

            if (!array_key_exists($slideNumber, $slideNumbersToLangCodesToNewSubtitleFileMappings)) {
                $slideNumbersToLangCodesToNewSubtitleFileMappings[$slideNumber] = [];
            }

            $slideNumbersToLangCodesToNewSubtitleFileMappings[$slideNumber][$langCode] = $fileBuffer;
        }

        $slideNumbersOfSubtitleFilesThatCouldNotBeUnDefaulted = [];
        $slideNumbersToUnsetDefaultSubtitles = array_keys($slideNumbersAndTheirLangCodesToUnsetDefault);
        $errorMessage = '';

        if (count($slideNumbersToUnsetDefaultSubtitles) > 0) {
            foreach($slideNumbersToUnsetDefaultSubtitles as $slideNumber) {
                $langCode = $slideNumbersAndTheirLangCodesToUnsetDefault[$slideNumber];

                $nameOfSubtitleFileToRename = "$overallPostId/$slideNumber/$langCode/default";

                try {
                    $this->s3VidSubtitlesForPostsBucket->move(
                        $nameOfSubtitleFileToRename,
                        "$overallPostId/$slideNumber/$langCode"
                    );
                }
                catch (\Exception) {
                    $errorMessage .= "• There was trouble un-setting the default-status of the post's vid-subtitle file for
                    slide-number $slideNumber and lang-code $langCode. Hence, the post's new vid-subtitle file provided for
                    that combo of slide-number and lang-code cannot be set as the default for that slide-number\n";

                    if (!array_key_exists($slideNumber, $slideNumbersOfSubtitleFilesThatCouldNotBeUnDefaulted)) {
                        $slideNumbersOfSubtitleFilesThatCouldNotBeUnDefaulted[$slideNumber] = true;
                    }
                }
            }
        }

        $slideNumbersToLangCodesOfSubtitleFilesThatCouldNotBeRemoved = [];
        if (count($subtitleFilesToRemove) > 0) {
            foreach($subtitleFilesToRemove as $subtitleFileToRemove) {
                $slideNumber = $subtitleFilesToRemove['slideNumber'];
                $langCode = $subtitleFilesToRemove['langCode'];
                $wasDefault = $subtitleFileToRemove['wasDefault'];

                $nameOfSubtitleFileToRemove = "$overallPostId/$slideNumber/$langCode";
                if ($wasDefault) {
                    $nameOfSubtitleFileToRemove .= '/default';
                }

                try {
                    $this->s3VidSubtitlesForPostsBucket->delete($nameOfSubtitleFileToRemove);
                }
                catch (\Exception) {
                    $errorMessage .= "• There was trouble removing the post's vid-subtitle file for slide-number
                    $slideNumber and lang-code $langCode. Hence, the post's new vid-subtitle file provided for that
                    combo of slide-number and lang-code could not be added.\n";

                    if (!array_key_exists($slideNumber, $slideNumbersToLangCodesOfSubtitleFilesThatCouldNotBeRemoved)) {
                        $slideNumbersToLangCodesOfSubtitleFilesThatCouldNotBeRemoved[$slideNumber] = [];
                    }
                    
                    $slideNumbersToLangCodesOfSubtitleFilesThatCouldNotBeRemoved[$slideNumber][$langCode] = true;
                }
            }
        }

        $newSubtitleFilesThatHaveBeenUploadedSuccessfully = [];

        if ($isEncrypted) {
            foreach(array_keys($slideNumbersToLangCodesToNewSubtitleFileMappings) as $slideNumber) {
                foreach(array_keys($slideNumbersToLangCodesToNewSubtitleFileMappings[$slideNumber]) as $langCode) {
                    $newSubtitlesFileBuffer = $slideNumbersToLangCodesToNewSubtitleFileMappings[$slideNumber][$langCode];
                    $newSubtitlesFileIsDefault = false;

                    if (array_key_exists($slideNumber, $slideNumbersToLangCodesOfSubtitleFilesThatCouldNotBeRemoved) && 
                    array_key_exists($langCode, $slideNumbersToLangCodesOfSubtitleFilesThatCouldNotBeRemoved[$slideNumber])) 
                    {
                        continue;
                    }
                    
                    if ($slideNumbersAndTheirNewDefaultLangCodes[$slideNumber] == $langCode) {
                        $newSubtitlesFileIsDefault = true;
                    }

                    if ($newSubtitlesFileIsDefault && array_key_exists($slideNumber,
                    $slideNumbersOfSubtitleFilesThatCouldNotBeUnDefaulted))  {
                        $newSubtitlesFileIsDefault = false;
                    }

                    $nameOfSubtitleFileToAdd = "$overallPostId/$slideNumber/$langCode";
                    if ($newSubtitlesFileIsDefault) {
                        $nameOfSubtitleFileToAdd .= '/default';
                    }

                    $subtitlesFileEncryptionInfo = $this->encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                        $newSubtitlesFileBuffer,
                        $plaintextDataEncryptionKey
                    );
                    $encryptedSubtitlesFileBuffer = $subtitlesFileEncryptionInfo[0];
                    $encryptedSubtitlesFileIv= $subtitlesFileEncryptionInfo[1];
                    $encryptedSubtitlesFileAuthTag = $subtitlesFileEncryptionInfo[2];

                    try {
                        $this->s3VidSubtitlesForPostsBucket->put(
                            $nameOfSubtitleFileToAdd, $encryptedSubtitlesFileBuffer
                        );

                        try {
                            $newEncryptedPostVidSubtitlesInfo = [
                                'overallPostId' => $overallPostId,
                                'slideNumber' => $slideNumber,
                                'langCode' => $langCode,
    
                                'fileEncryptionIv' => $encryptedSubtitlesFileIv,
                                'fileEncryptionAuthTag' => $encryptedSubtitlesFileAuthTag
                            ];
    
                            EncryptedPostVidSubtitlesInfo::create($newEncryptedPostVidSubtitlesInfo);
    
                            $newSubtitleFilesThatHaveBeenUploadedSuccessfully[] = $newEncryptedPostVidSubtitlesInfo;
                        }
                        catch (\Exception) {
                            $errorMessage .= "• There was trouble adding the info required to decrypt the new encrypted
                            vid-subtitle file for slide-number $slideNumber and lang-code $langCode.\n";
                            return response(
                                $errorMessage,
                                502
                            );
                        }
                    }
                    catch (\Exception) {
                        $errorMessage .= "• There was trouble adding the new vid-subtitle file for slide-number
                        $slideNumber and lang-code $langCode.\n";
                    }
                }
            }

            if (count($newSubtitleFilesThatHaveBeenUploadedSuccessfully) > 0) {
                try {

                    $this->redisClient->pipeline(function ($pipe) use ($newSubtitleFilesThatHaveBeenUploadedSuccessfully,
                    $overallPostId) {
                        foreach ($newSubtitleFilesThatHaveBeenUploadedSuccessfully as $newlyUploadedSubtitleFile) {
                            $slideNumber = $newlyUploadedSubtitleFile['slideNumber'];
                            $langCode = $newlyUploadedSubtitleFile['langCode'];
                            $encryptedVidSubtitlesInfo = [
                                'fileEncryptionIv' => $newlyUploadedSubtitleFile['fileEncryptionIv'],
                                'fileEncryptionAuthTag' => $newlyUploadedSubtitleFile['fileEncryptionAuthTag']
                            ];
    
                            $pipe->hMSet(
                                "encryptedVidSubtitlesInfoForPost$overallPostId@slideNumber$slideNumber@langCode$langCode",
                                $encryptedVidSubtitlesInfo
                            );
                        }
                    });
                }
                catch (\Exception) {
                    $errorMessage .= "• There was trouble updating the cache of posts and their encrypted-vid-subtitles
                    info\n";
                }
            }
        }
        else {
            foreach(array_keys($slideNumbersToLangCodesToNewSubtitleFileMappings) as $slideNumber) {
                foreach(array_keys($slideNumbersToLangCodesToNewSubtitleFileMappings[$slideNumber]) as $langCode) {
                    $newSubtitlesFileBuffer = $slideNumbersToLangCodesToNewSubtitleFileMappings[$slideNumber][$langCode];
                    $newSubtitlesFileIsDefault = false;

                    if (array_key_exists($slideNumber, $slideNumbersToLangCodesOfSubtitleFilesThatCouldNotBeRemoved) && 
                    array_key_exists($langCode, $slideNumbersToLangCodesOfSubtitleFilesThatCouldNotBeRemoved[$slideNumber])) 
                    {
                        continue;
                    }
                    
                    if ($slideNumbersAndTheirNewDefaultLangCodes[$slideNumber] == $langCode) {
                        $newSubtitlesFileIsDefault = true;
                    }

                    if ($newSubtitlesFileIsDefault && array_key_exists($slideNumber,
                    $slideNumbersOfSubtitleFilesThatCouldNotBeUnDefaulted))  {
                        $newSubtitlesFileIsDefault = false;
                    }


                    $nameOfSubtitleFileToAdd = "$overallPostId/$slideNumber/$langCode";
                    if ($newSubtitlesFileIsDefault) {
                        $nameOfSubtitleFileToAdd .= '/default';
                    }

                    try {
                        $this->s3VidSubtitlesForPostsBucket->put(
                            $nameOfSubtitleFileToAdd, $newSubtitlesFileBuffer
                        );

                        $newSubtitleFilesThatHaveBeenUploadedSuccessfully[] = [
                            'overallPostId' => $overallPostId,
                            'slideNumber' => $slideNumber,
                            'langCode' => $langCode
                        ];
                    }
                    catch (\Exception) {
                        $errorMessage .= "• There was trouble adding the new vid-subtitle file for slide-number
                        $slideNumber and lang-code $langCode.\n";
                    }
                }
            }
        }


        return response()->json([
            $errorMessage => 'errorMessage'
        ], 201);
    }


    public function setOrUnsetDefaultVidSubtitleFilesOfPost(Request $request, string $overallPostId) {
        $slideNumbersToNewDefaultLangCodes = $request->input('slideNumbersToNewDefaultLangCodes');

        $rudimentaryInfoOnVidSubtitlesOfPost = $this->postVidSubtitlesService->getRudimentaryInfoOnVidSubtitlesOfPost(
            $overallPostId,
            $this->s3VidSubtitlesForPostsBucket
        );
        if (is_string($rudimentaryInfoOnVidSubtitlesOfPost[0])) {
            return response(
                $rudimentaryInfoOnVidSubtitlesOfPost[0],
                $this->stringLabelToIntStatusCodeMappings[
                    $rudimentaryInfoOnVidSubtitlesOfPost[1]
                ]
            );
        }

        $slideNumbersToLangCodesOfVidSubtitlesToUnsetDefault = [];
        $slideNumbersToLangCodesOfVidSubtitlesToSetDefault = [];
        $errorMessage = "";

        foreach(array_keys($slideNumbersToNewDefaultLangCodes) as $slideNumber) {
            $newDefaultLangCode = $slideNumbersToNewDefaultLangCodes[$slideNumber];

            if (array_key_exists($slideNumber, $rudimentaryInfoOnVidSubtitlesOfPost)) {
                if ($newDefaultLangCode === "") {
                    if ($rudimentaryInfoOnVidSubtitlesOfPost[$slideNumber]['isDefault'] == null) {
                        $errorMessage .= "• There are no default subtitle-files to unset for post $overallPostId at 
                        slide-number $slideNumber\n";
                    }
                    else {
                        $slideNumbersToLangCodesOfVidSubtitlesToUnsetDefault[$slideNumber] =
                        $rudimentaryInfoOnVidSubtitlesOfPost[$slideNumber]['isDefault'];
                    }
                }
                else {
                    if (array_key_exists($newDefaultLangCode, $rudimentaryInfoOnVidSubtitlesOfPost[$slideNumber])) {
                        if ($rudimentaryInfoOnVidSubtitlesOfPost[$slideNumber]['isDefault'] !== null) {
                            $slideNumbersToLangCodesOfVidSubtitlesToUnsetDefault[$slideNumber] =
                            $rudimentaryInfoOnVidSubtitlesOfPost[$slideNumber]['isDefault'];
                        }

                        $slideNumbersToLangCodesOfVidSubtitlesToSetDefault[$slideNumber] = $newDefaultLangCode;
                    }
                    else {
                        $errorMessage .= "• You cannot set the default lang-code to $newDefaultLangCode for post $overallPostId
                        at slide-number $slideNumber, because there does not exist a subtitle-file in that slide-number
                        with that lang-code.\n";
                    }
                }
            }
            else {
                $errorMessage .= "• There are no subtitle-files for post $overallPostId at slide-number $slideNumber\n";
            }
        }

        $listOfSlideNumbersToUnsetDefault = array_keys($slideNumbersToLangCodesOfVidSubtitlesToUnsetDefault);
        $slideNumbersThatHaveNotSuccessfullyUnsetDefault = [];

        if (count($listOfSlideNumbersToUnsetDefault) > 0) {
           foreach($listOfSlideNumbersToUnsetDefault as $slideNumberToUnsetDefault) {
                $langCodeToUnsetDefault = $slideNumbersToLangCodesOfVidSubtitlesToUnsetDefault[$slideNumberToUnsetDefault];
                try {
                    $this->s3VidSubtitlesForPostsBucket->move(
                        "$overallPostId/$slideNumberToUnsetDefault/$langCodeToUnsetDefault/default",
                        "$overallPostId/$slideNumberToUnsetDefault/$langCodeToUnsetDefault"
                    );
                }
                catch (\Exception) {
                    $errorMessage .= "There was trouble un-setting the default vid-subtitles-file for this post at
                    slide-number $slideNumberToUnsetDefault. This also means that if you tried to set the default
                    lang-code for this slide-number to something else, that cannot take place since each slide
                    can only have one default vid-subtitles file.";
                    $slideNumbersThatHaveNotSuccessfullyUnsetDefault[$slideNumberToUnsetDefault] = true;
                }
           }
        }

        $listOfSlideNumbersToSetDefault = array_keys($slideNumbersToLangCodesOfVidSubtitlesToSetDefault);
        $listOfSlideNumbersToSetDefault = array_filter(
            $listOfSlideNumbersToSetDefault,
            function ($slideNumber) use ($slideNumbersThatHaveNotSuccessfullyUnsetDefault) {
                return !array_key_exists($slideNumber, $slideNumbersThatHaveNotSuccessfullyUnsetDefault);
            }
        );

        if (count($listOfSlideNumbersToSetDefault) > 0) {
           foreach($listOfSlideNumbersToSetDefault as $slideNumberToSetDefault) {
                $langCodeToSetDefault = $slideNumbersToLangCodesOfVidSubtitlesToSetDefault[$slideNumberToSetDefault];

                try {
                    $this->s3VidSubtitlesForPostsBucket->move(
                        "$overallPostId/$slideNumberToSetDefault/$langCodeToSetDefault",
                        "$overallPostId/$slideNumberToSetDefault/$langCodeToSetDefault/default"
                    );
                }
                catch (\Exception) {
                    $errorMessage .= "There was trouble setting the default vid-subtitles-file for this post at
                    slide-number $slideNumberToSetDefault to the lang-code $langCodeToSetDefault";
                }
           }
        }

        return response()->json([
            'ErrorMessage' => $errorMessage
        ], 200);
    }


    public function removeSpecifiedVidSubtitleFilesFromPost(Request $request, string $overallPostId, bool $isEncrypted) {
        $slideNumbersToListOfLangCodesToRemove = $request->input('slideNumberToListOfLangCodesToRemoveMappings');

        $rudimentaryInfoOnVidSubtitlesOfPost = $this->postVidSubtitlesService->getRudimentaryInfoOnVidSubtitlesOfPost(
            $overallPostId,
            $this->s3VidSubtitlesForPostsBucket
        );
        if (is_string($rudimentaryInfoOnVidSubtitlesOfPost[0])) {
            return response(
                $rudimentaryInfoOnVidSubtitlesOfPost[0],
                $this->stringLabelToIntStatusCodeMappings[
                    $rudimentaryInfoOnVidSubtitlesOfPost[1]
                ]
            );
        }

        $errorMessage = "";
        $slideNumbersThatNoLongerHaveDefaultSubtitles = [];
        $listOfVidSubtitleFilesToDelete = [];

        if ($slideNumbersToListOfLangCodesToRemove === 'all') {
            foreach(array_keys($rudimentaryInfoOnVidSubtitlesOfPost) as $slideNumber) {
                foreach($rudimentaryInfoOnVidSubtitlesOfPost[$slideNumber] as $langCode) {
                    if ($langCode === 'isDefault') {
                        continue;
                    }

                    $infoOnSubtitleFileToDelete = [
                        'slideNumber' => $slideNumber,
                        'langCode' => $langCode,
                        'isDefault' => false
                    ];
    
                    if ($rudimentaryInfoOnVidSubtitlesOfPost[$slideNumber]['isDefault'] === $langCode) {
                        $slideNumbersThatNoLongerHaveDefaultSubtitles[] = $slideNumber;
                        $infoOnSubtitleFileToDelete['isDefault'] = true;
                    }
    
                    $listOfVidSubtitleFilesToDelete[] = $infoOnSubtitleFileToDelete;
                }
            }
        }
        else {
            foreach(array_keys($slideNumbersToListOfLangCodesToRemove) as $slideNumber) {
                foreach($slideNumbersToListOfLangCodesToRemove[$slideNumber] as $langCode) {
                    if ($langCode === 'all') {
                        foreach($rudimentaryInfoOnVidSubtitlesOfPost[$slideNumber] as $languageCode) {
                            if ($languageCode === 'isDefault') {
                                continue;
                            }
        
                            $infoOnSubtitleFileToDelete = [
                                'slideNumber' => $slideNumber,
                                'langCode' => $languageCode,
                                'isDefault' => false
                            ];
            
                            if ($rudimentaryInfoOnVidSubtitlesOfPost[$slideNumber]['isDefault'] === $languageCode) {
                                $slideNumbersThatNoLongerHaveDefaultSubtitles[] = $slideNumber;
                                $infoOnSubtitleFileToDelete['isDefault'] = true;
                            }
            
                            $listOfVidSubtitleFilesToDelete[] = $infoOnSubtitleFileToDelete;
                        }
                    }
                    else {
                        if (!array_key_exists($slideNumber, $rudimentaryInfoOnVidSubtitlesOfPost) || !array_key_exists(
                            $langCode, $rudimentaryInfoOnVidSubtitlesOfPost[$slideNumber])) {
                                $errorMessage .= "• The subtitle file with slide-number $slideNumber and lang-code $langCode cannot be
                                deleted since it does not exist\n";
                                continue;
                            }
            
                            $infoOnSubtitleFileToDelete = [
                                'slideNumber' => $slideNumber,
                                'langCode' => $langCode,
                                'isDefault' => false
                            ];
            
                            if ($rudimentaryInfoOnVidSubtitlesOfPost[$slideNumber]['isDefault'] === $langCode) {
                                $slideNumbersThatNoLongerHaveDefaultSubtitles[] = $slideNumber;
                                $infoOnSubtitleFileToDelete['isDefault'] = true;
                            }
            
                            $listOfVidSubtitleFilesToDelete[] = $infoOnSubtitleFileToDelete;
                    }
                }
            }
        }

        $subtitleFilesThatWereSuccessfullyDeleted = [];
        $slideNumbersOfDefaultSubtitleFilesThatDidNotSuccessfullyDelete = [];

        foreach($listOfVidSubtitleFilesToDelete as $vidSubtitlesFileToDelete) {
            $slideNumber = $vidSubtitlesFileToDelete['slideNumber'];
            $langCode = $vidSubtitlesFileToDelete['langCode'];
            $default = $vidSubtitlesFileToDelete['isDefault'];

            $nameOfVidSubtitlesFileToDelete = "$overallPostId/$slideNumber/$langCode";
            if ($default) {
                $nameOfVidSubtitlesFileToDelete .= '/default';
            }

            try {
                $this->s3VidSubtitlesForPostsBucket->delete($nameOfVidSubtitlesFileToDelete);
                $subtitleFilesThatWereSuccessfullyDeleted[] = [
                    'slideNumber' => $slideNumber,
                    'langCode' => $langCode,
                    'isDefault' => $default,
                ];
            }
            catch (\Exception) {
                $errorMessage .= "• There was trouble deleting the vid-subtitle file of the post at slide $slideNumber
                and langCode $langCode\n";
                $slideNumbersOfDefaultSubtitleFilesThatDidNotSuccessfullyDelete[$slideNumber] = true;
            }
        }

        if ($isEncrypted && count($subtitleFilesThatWereSuccessfullyDeleted) > 0) {
            try {
                foreach($subtitleFilesThatWereSuccessfullyDeleted as $successfullyDeletedSubtitlesFile) {
                    EncryptedPostVidSubtitlesInfo::where('overallPostId', $overallPostId)
                        ->where('slideNumber', $successfullyDeletedSubtitlesFile['slideNumber'])
                        ->where('langCode', $successfullyDeletedSubtitlesFile['langCode'])
                        ->delete();
                }
            }
            catch (\Exception) {
                $errorMessage .= '• There was trouble deleting the encryption-info of each of the successfully deleted
                vid-subtitles of this encrypted post\n';

                return response(
                    $errorMessage,
                    502
                );
            }
        }

        return response()->json([
            'ErrorMessage' => $errorMessage
        ], 200);
    }


    public function removeBgMusicAndVidSubtitlesFromPostAfterItsDeletion(string $overallPostId, bool $isEncrypted) {

        $numVidSubtitlesDeleted = 0;
        try {
            $namesOfVidSubtitleFilesOfAllPosts = $this->s3VidSubtitlesForPostsBucket->files('');

            $namesOfAllVidSubtitleFilesOfPost = array_filter(
                $namesOfVidSubtitleFilesOfAllPosts,
                function ($fileName) use ($overallPostId) {
                    return str_starts_with($fileName, $overallPostId);
                }
            );

            foreach($namesOfAllVidSubtitleFilesOfPost as $nameOfVidSubtitlesFileToDelete) {
                $this->s3VidSubtitlesForPostsBucket->delete($nameOfVidSubtitlesFileToDelete);
            }

            $numVidSubtitlesDeleted = count($namesOfAllVidSubtitleFilesOfPost);
        }
        catch (\Exception) {
            return response(
                "There was trouble deleting all the vid-subtitle files of the post",
                502
            );
        }

        if ($isEncrypted) {
            try {
                EncryptedPostVidSubtitlesInfo::where('overallPostId', $overallPostId)
                    ->delete();
            }
            catch (\Exception) {
                return response(
                    "There was trouble deleting the encryption info of each of the subtitles of the post",
                    502
                );
            }
        }

        $postHadBgMusic = false;

        try {
            $filenameOfAudioFileToDelete = $overallPostId . '.mp3';

            $postHadBgMusic =  $this->gcsBgMusicOfPostsBucket->exists($filenameOfAudioFileToDelete);

            if ($postHadBgMusic) {
                $this->gcsBgMusicOfPostsBucket->delete($filenameOfAudioFileToDelete);
            }
        }
        catch (\Exception) {
            return response(
                'There was trouble deleting the audio-file, if any, that is associated with the background-music of this
                post',
                502
            );
        }

        if ($postHadBgMusic) {
            try {
                $this->redisClient->del("bgMusicMetadataForPost$overallPostId");
            }
            catch (\Exception) {
                return response(
                    'There was trouble deleting the caching, if any, associated with the metadata of the background-music
                    of this post',
                    502
                );
            }
        }

        if ($postHadBgMusic && $isEncrypted) {
            try {
                EncryptedPostBgMusicInfo
                    ::where('overallPostId', $overallPostId)
                    ->delete();
            }
            catch (\Exception) {
                return response(
                    'There was trouble deleting metadata associated with the background-music of this post.',
                    502
                );
            }
        }
        else if ($postHadBgMusic) {
            try {
                UnencryptedPostBgMusicInfo
                    ::where('overallPostId', $overallPostId)
                    ->delete();
            }
            catch (\Exception) {
                return response(
                    'There was trouble deleting metadata associated with the background-music of this post.',
                    502
                );
            }
        }

        if ($isEncrypted) {
            try {
                PostBgMusicAndVidSubtitlesEncryptionInfo::
                    where('overallPostId', $overallPostId)
                    ->delete();
            }
            catch (\Exception) {
                return response(
                    'There was trouble deleting the encrypted data-encryption-keys that were used for the encryption/
                    decryption of vid-subtitle-files and background-music of this post',
                    502
                );
            }

            try {
                $this->redisClient->hDel(
                    'Posts and their EncryptedDEKs for Bg-Music/Vid-Subs',
                    $overallPostId
                );
            }
            catch (\Exception) {
                return response(
                    'There was trouble deleting the caching of the encrypted data-encryption-keys that were used for the
                    encryption/decryption of vid-subtitle-files and background-music of this post',
                    502
                );
            }
        }

        return response()->json([
            'numVidSubtitlesDeleted' =>  $numVidSubtitlesDeleted,
            'postHadBgMusic' => $postHadBgMusic
        ], 200);
    }


    public function getProfilePhotoOfUser(Request $request, int $authUserId, int $userId) {
        if ($authUserId < 1 && $authUserId !== -1) {
            return response('There does not exist a user with the provided authUserId. If you are just an anonymous guest,
            you must set the authUserId to -1.', 400);
        }

        if ($userId < 1) {
            return response('There does not exist a user with the provided userId.', 400);
        }

        $authUserIsAnonymousGuest = $authUserId == -1;

        if (!$authUserIsAnonymousGuest) {
            $userAuthenticationResult =  $this->userAuthService->authenticateUser(
                $authUserId, $request
            );

            if (is_bool($userAuthenticationResult)) {
                if (!$userAuthenticationResult) {
                    return response("The expressJSBackend1 server could not verify you as having the proper
                    credentials to be logged in as $authUserId", 403);
                }
            }
            else if (is_string($userAuthenticationResult)) {  
                if ($userAuthenticationResult === 'The provided authUser token, if any, in your cookies has an
                invalid structure.')  {  
                    return response($userAuthenticationResult, 403);  
                }  
                return response($userAuthenticationResult, 502);  
            }  
            else {  
                $refreshedAuthToken = $userAuthenticationResult[0];  
                $expirationDate = $userAuthenticationResult[1];  

                setcookie(
                    "authToken$authUserId",
                    $refreshedAuthToken,
                    $expirationDate,
                    '/',
                    '',
                    true,
                    true
                );
            }  
        }

        if (!$authUserIsAnonymousGuest) {
            try {
                $response = Http::get(
                    "http://34.111.89.101/api/Home-Page/djangoBackend2/checkIfUserIsInBlockingsOfAuthUser/$authUserId/$userId"
                );
    
                
                if ($response->failed()) {
                    return response(
                        "The djangoBackend2 server had trouble checking whether or not user $userId is in your blockings",
                        502
                    );
                }
    
                $stringifiedResponseData = $response->body();
                $userIsInBlockingsOfAuthUser = json_decode($stringifiedResponseData);
                
                if ($userIsInBlockingsOfAuthUser) {
                    return response("The profile photo of user $userId, if they even exist, could not be found", 404);
                }
            }
            catch (\Exception) {
                return response(
                    "There was trouble connecting to the djangoBackend2 server to check whether or not user $userId is in your
                    blockings",
                    502
                );
            }
        }

        try {
            $redisResult = $this->redisClient->hGet(
                "dataForUser$userId",
                'hasProfilePhoto'
            );

            if ($redisResult == false) {
                return response("The profile photo of user $userId could not be found", 404);
            }
        }
        catch (\Exception) {
            //pass
        }

        $profilePhoto = null;

        try {
            $profilePhoto = ProfilePhoto::where('userId', $userId)
                ->value('profilePhoto');
        }
        catch (\Exception) {
            return response("There was trouble fetching the profile-photo of user $userId.", 502);
        }


        if ($profilePhoto == null) {
            return response("The profile photo of user $userId, if they even exist, could not be found", 404);
        }

        return response($profilePhoto, 200);
    }


    public function getProfilePhotosOfMultipleUsersAsAuthUser(int $authUserId, Request $request) {
        if ($authUserId < 1 && $authUserId !== -1) {
            return response('There does not exist a user with the provided authUserId. If you are just an anonymous guest,
            you must set the authUserId to -1.', 400);
        }

        $request->validate([
            'userIds' => 'required|array',
            'userIds.*' => 'integer',
        ]);        

        $userIds = $request->input('userIds');

        $originalUserIds = $userIds;

        $userIds = array_filter($userIds, function($userId) {
            return $userId > 0;
        });
        
        if (count($userIds) == 0) {
            return response(
                'You did not provide a valid list of userIds for the \'userIds\' parameter of the body this REST-API
                POST-request.',
                400
            );
        }

        $authUserIsAnonymousGuest = $authUserId == -1;

        if (!$authUserIsAnonymousGuest) {
            $userAuthenticationResult =  $this->userAuthService->authenticateUser(
                $authUserId, $request
            );

            if (is_bool($userAuthenticationResult)) {
                if (!$userAuthenticationResult) {
                    return response("The expressJSBackend1 server could not verify you as having the proper
                    credentials to be logged in as $authUserId", 403);
                }
            }
            else if (is_string($userAuthenticationResult)) {  
                if ($userAuthenticationResult === 'The provided authUser token, if any, in your cookies has an
                invalid structure.')  {  
                    return response($userAuthenticationResult, 403);  
                }  
                return response($userAuthenticationResult, 502);  
            }  
            else {  
                $refreshedAuthToken = $userAuthenticationResult[0];  
                $expirationDate = $userAuthenticationResult[1];  

                setcookie(
                    "authToken$authUserId",
                    $refreshedAuthToken,
                    $expirationDate,
                    '/',
                    '',
                    true,
                    true
                );
            }  
        }

        $usersAndIfTheyAreInBlockingsOfAuthUser = [];

        if (!$authUserIsAnonymousGuest) {
            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->post(
                    "http://34.111.89.101/api/Home-Page/djangoBackend2/checkIfUsersInListAreInBlockingsOfAuthUser/$authUserId",
                    [
                        'userIds' => $userIds
                    ]
                );
    
                if ($response->failed()) {
                    return response(
                        'The djangoBackend2 server had trouble checking whether or not any of the users in the list are in your
                        blockings',
                        502
                    );
                }
    
                $stringifiedResponseData = $response->body();
                $usersAndIfTheyAreInBlockingsOfAuthUser = json_decode($stringifiedResponseData, true);            
            }
            catch (\Exception) {
                return response(
                    'There was trouble connecting to the djangoBackend2 server to check whether or not any of the users in the
                    list are in your blockings',
                    502
                );
            }
        }

        $userIds = array_filter($userIds, function($userId) use ($usersAndIfTheyAreInBlockingsOfAuthUser) {
            return !$usersAndIfTheyAreInBlockingsOfAuthUser[$userId];
        });

        $usersAndTheirProfilePhotos = [];

        if (count($userIds) == 0) {
            foreach($originalUserIds as $originalUserId) {
                $usersAndTheirProfilePhotos[$originalUserId] = null;
            }

            return response($usersAndTheirProfilePhotos, 200);
        }

        try {
            $usersAndTheirProfilePhotos = ProfilePhoto::whereIn('userId', $userIds)
                ->pluck('profilePhoto', 'userId')
                ->toArray();

            foreach($originalUserIds as $originalUserId) {
                $usersAndTheirProfilePhotos[$originalUserId] = $usersAndTheirProfilePhotos[$originalUserId] ?? null;
            }

            return response($usersAndTheirProfilePhotos, 200);
        }
        catch (\Exception) {
            return response("There was trouble fetching the profile-photos", 502);
        }
    }


    public function addOwnProfilePhoto(Request $request, int $authUserId) {
        if ($authUserId < 1) {
            return response('There does not exist a user with the provided authUserId.', 400);
        }

        $request->validate([
            'profilePhoto' => 'required|image|mimes:jpeg,png,jpg|max:8192',
        ]);        
        $profilePhotoFile = request()->file('profilePhoto');
        $profilePhotoFileBuffer = file_get_contents($profilePhotoFile->getRealPath());

        $userAuthenticationResult =  $this->userAuthService->authenticateUser(
            $authUserId, $request
        );

        if (is_bool($userAuthenticationResult)) {
            if (!$userAuthenticationResult) {
                return response("The expressJSBackend1 server could not verify you as having the proper
                credentials to be logged in as $authUserId", 403);
            }
        }
        else if (is_string($userAuthenticationResult)) {  
            if ($userAuthenticationResult === 'The provided authUser token, if any, in your cookies has an
            invalid structure.')  {  
                return response($userAuthenticationResult, 403);  
            }  
            return response($userAuthenticationResult, 502);  
        }  
        else {  
            $refreshedAuthToken = $userAuthenticationResult[0];  
            $expirationDate = $userAuthenticationResult[1];  

            setcookie(
                "authToken$authUserId",
                $refreshedAuthToken,
                $expirationDate,
                '/',
                '',
                true,
                true
            );
        }  

        $authUserHasProfilePhoto = null;

        try {
            $authUserHasProfilePhoto = $this->redisClient->hGet(
                "dataForUser$authUserId",
                'hasProfilePhoto'
            );

            if ($authUserHasProfilePhoto == true) {
                return response(
                    'You already have a profile-photo. If you would like to update or delete it, you must use the corresponding
                    endpoint, not this one',
                    409
                );
            }
        }
        catch (\Exception) {
            //pass
        }

        if ($authUserHasProfilePhoto == null) {
            try {
                $profilePhotoOfAuthUser = ProfilePhoto::where('userId', $authUserId)
                    ->value('profilePhoto');
                
                if ($profilePhotoOfAuthUser !== null) {
                    return response(
                        'You already have a profile-photo. If you would like to update or delete it, you must use the corresponding
                        endpoint, not this one',
                        409
                    );
                }
            }
            catch (\Exception) {
                return response(
                    'There was trouble checking whether or not you already have a profile-photo.',
                    502
                );
            }
        }

        try {
            ProfilePhoto::create([
                'userId' => $authUserId,
                'profilePhoto' => $profilePhotoFileBuffer
            ]);
        }   
        catch (\Exception) {
            return response(
                "There was trouble adding your profile-photo",
                502
            );
        }

        try {
            $this->redisClient->hSet(
                "dataForUser$authUserId",
                'hasProfilePhoto',
                'true'
            );
        }
        catch (\Exception) {
            return response(
                "There was trouble updating the caching of the 'hasProfilePhoto' attribute of the data for user $authUserId",
                502
            );
        }

        return response(true, 201);
    }


    public function updateOwnProfilePhoto(Request $request, int $authUserId) {
        if ($authUserId < 1) {
            return response('There does not exist a user with the provided authUserId.', 400);
        }

        $request->validate([
            'profilePhoto' => 'required|image|mimes:jpeg,png,jpg|max:8192',
        ]);        
        $profilePhotoFile = request()->file('profilePhoto');
        $profilePhotoFileBuffer = file_get_contents($profilePhotoFile->getRealPath());

        $userAuthenticationResult =  $this->userAuthService->authenticateUser(
            $authUserId, $request
        );

        if (is_bool($userAuthenticationResult)) {
            if (!$userAuthenticationResult) {
                return response("The expressJSBackend1 server could not verify you as having the proper
                credentials to be logged in as $authUserId", 403);
            }
        }
        else if (is_string($userAuthenticationResult)) {  
            if ($userAuthenticationResult === 'The provided authUser token, if any, in your cookies has an
            invalid structure.')  {  
                return response($userAuthenticationResult, 403);  
            }  
            return response($userAuthenticationResult, 502);  
        }  
        else {  
            $refreshedAuthToken = $userAuthenticationResult[0];  
            $expirationDate = $userAuthenticationResult[1];  

            setcookie(
                "authToken$authUserId",
                $refreshedAuthToken,
                $expirationDate,
                '/',
                '',
                true,
                true
            );
        }  

        $authUserHasProfilePhoto = null;

        try {
            $authUserHasProfilePhoto = $this->redisClient->hGet(
                "dataForUser$authUserId",
                'hasProfilePhoto'
            );

            if ($authUserHasProfilePhoto == false) {
                return response(
                    'You do not already have a profile-photo. If you would like to add one you must use the corresponding endpoint, not
                    this one',
                    400
                );
            }
        }
        catch (\Exception) {
            //pass
        }

        if ($authUserHasProfilePhoto == null) {
            try {
                $profilePhotoOfAuthUser = ProfilePhoto::where('userId', $authUserId)
                    ->value('profilePhoto');
                
                if ($profilePhotoOfAuthUser == null) {
                    return response(
                        'You do not already have a profile-photo. If you would like to add one you must use the corresponding endpoint,
                        not this one',
                        400
                    );
                }
            }
            catch (\Exception) {
                return response(
                    'There was trouble checking whether or not you already have a profile-photo.',
                    502
                );
            }
        }

        try {
            ProfilePhoto::where('userId', $authUserId)->update([
                'profilePhoto' => $profilePhotoFileBuffer
            ]);            
        }   
        catch (\Exception) {
            return response(
                "There was trouble updating your profile-photo",
                502
            );
        }
        
        return response(true, 200);
    }


    public function deleteOwnProfilePhoto(Request $request, int $authUserId) {
        if ($authUserId < 1) {
            return response('There does not exist a user with the provided authUserId.', 400);
        }

        $userAuthenticationResult = $this->userAuthService->authenticateUser(
            $authUserId, $request
        );

        if (is_bool($userAuthenticationResult)) {
            if (!$userAuthenticationResult) {
                return response("The expressJSBackend1 server could not verify you as having the proper
                credentials to be logged in as $authUserId", 403);
            }
        }
        else if (is_string($userAuthenticationResult)) {  
            if ($userAuthenticationResult === 'The provided authUser token, if any, in your cookies has an
            invalid structure.')  {  
                return response($userAuthenticationResult, 403);  
            }  
            return response($userAuthenticationResult, 502);  
        }  
        else {  
            $refreshedAuthToken = $userAuthenticationResult[0];  
            $expirationDate = $userAuthenticationResult[1];  

            setcookie(
                "authToken$authUserId",
                $refreshedAuthToken,
                $expirationDate,
                '/',
                '',
                true,
                true
            );
        }  

        try {
            $redisResult = $this->redisClient->hGet(
                "dataForUser$authUserId",
                'hasProfilePhoto'
            );

            if ($redisResult == false) {
                return response(false, 200);
            }
        }
        catch (\Exception) {
            //pass
        }

        $profilePhotoWasFoundAndDeleted = false;

        try {
            $numProfilePhotosDeleted = ProfilePhoto::where('userId', $authUserId)
                ->delete();
            $profilePhotoWasFoundAndDeleted = $numProfilePhotosDeleted == 1;
        }   
        catch (\Exception) {
            return response(
                "There was trouble deleting your profile-photo",
                502
            );
        }

        if ($profilePhotoWasFoundAndDeleted) {
            try {
                $this->redisClient->hSet(
                    "dataForUser$authUserId",
                    'hasProfilePhoto',
                    'false'
                );
            }
            catch (\Exception) {
                return response(
                    "There was trouble updating the caching of the 'hasProfilePhoto' attribute of the data for user $authUserId",
                    502
                );
            }
        }

        return response(
            $profilePhotoWasFoundAndDeleted,
            200
        );
    }


    public function getVerificationStatusOfUser(Request $request, int $authUserId, int $userId) {
        if ($authUserId < 1 && $authUserId !== -1) {
            return response(
                'There does not exist a user with the provided authUserId. If you are just an anonymous guest, you must set the
                authUserId to -1.',
                400
            );
        }

        if ($userId < 1) {
            return response(
                'There does not exist a user with the provided userId.',
                400
            );
        }

        $authUserIsAnonymousGuest = $authUserId == -1;

        if (!$authUserIsAnonymousGuest) {
            $userAuthenticationResult =  $this->userAuthService->authenticateUser(
                $authUserId, $request
            );

            if (is_bool($userAuthenticationResult)) {
                if (!$userAuthenticationResult) {
                    return response(
                        "The expressJSBackend1 server could not verify you as having the proper
                        credentials to be logged in as $authUserId",
                        403
                    );
                }
            }
            else if (is_string($userAuthenticationResult)) {  
                if ($userAuthenticationResult === 'The provided authUser token, if any, in your cookies has an
                invalid structure.')  {  
                    return response($userAuthenticationResult, 403);  
                }  
                return response($userAuthenticationResult, 502);  
            }  
            else {  
                $refreshedAuthToken = $userAuthenticationResult[0];  
                $expirationDate = $userAuthenticationResult[1];  

                setcookie(
                    "authToken$authUserId",
                    $refreshedAuthToken,
                    $expirationDate,
                    '/',
                    '',
                    true,
                    true
                );
            }  
        }

        if (!$authUserIsAnonymousGuest) {
            try {
                $response = Http::get(
                    "http://34.111.89.101/api/Home-Page/djangoBackend2/checkIfUserIsInBlockingsOfAuthUser/$authUserId/$userId"
                );
    
                if ($response->failed()) {
                    return response(
                        "The djangoBackend2 server had trouble checking whether or not user $userId is in your blockings",
                        502
                    );
                }
    
                $stringifiedResponseData = $response->body();
                $userIsInBlockingsOfAuthUser = json_decode($stringifiedResponseData);
                
                if ($userIsInBlockingsOfAuthUser) {
                    return response("The user $userId does not exist", 404);
                }
            }
            catch (\Exception) {
                return response(
                    "There was trouble connecting to the djangoBackend2 server to check whether or not user $userId is in your
                    blockings",
                    502
                );
            }
        }

        $errorMessage = '';

        try {
            $redisResult = $this->redisClient->hGet(
                "dataForUser$userId",
                'isVerified'
            );
            
            if ($redisResult == 'true') {
                return response(
                    [
                        'isVerified' => true,
                        'ErrorMessage' => $errorMessage
                    ],
                    200
                );
            }
            else if ($redisResult == 'false') {
                return response(
                    [
                        'isVerified' => false,
                        'ErrorMessage' => $errorMessage
                    ],
                    200
                );
            }

            $errorMessage .= "• The user $userId does not exist\n";
            return response($errorMessage, 404);
        }
        catch (\Exception) {
            $errorMessage .= "• There was trouble fetching the verification-status of user $userId from the Redis-cache\n";
        }

        try {
            $verificationStatusOfUser = PublicUser::where('id', $userId)->value('isVerified');
            
            if ($verificationStatusOfUser == null) {
                $verificationStatusOfUser = PrivateUser::where('id', $userId)->value('isVerified');
                
                if ($verificationStatusOfUser == null) {
                    $errorMessage .= "• The user $userId does not exist\n";
                    return response($errorMessage, 404);
                }
            }
            
            return response(
                [
                    'isVerified' => $verificationStatusOfUser,
                    'ErrorMessage' => $errorMessage
                ],
                200
            );
        }
        catch (\Exception) {
            $errorMessage .= "• There was trouble fetching the asked-for data from the database\n";
            return response($errorMessage, 502);
        }
    }


    private function isIndexedArray($array) {
        if (!is_array($array)) {
            return false;
        }
        return array_keys($array) === range(0, count($array) - 1);
    }
}