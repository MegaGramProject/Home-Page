<?php

namespace App\Http\Controllers;

use App\Services\PostBgMusicService;
use App\Services\UserAuthService;
use App\Models\Oracle\PostBgMusicInfo\UnencryptedPostBgMusicInfo;
use App\Models\Oracle\PostBgMusicInfo\EncryptedPostBgMusicInfo;
use App\Models\Oracle\PostBgMusicAndVidSubtitlesEncryptionInfo;
use Illuminate\Support\Facades\Redis;

use Illuminate\Support\Facades\Storage;


class BackendController extends Controller {

    protected $postBgMusicService;
    protected $userAuthService;
    protected $postInfoFetchingService;
    protected $encryptionAndDecryptionService;
    protected $redisClient;
    protected $gcsBgMusicOfPostsBucket;
    protected $stringLabelToIntStatusCodeMappings;


    public function __construct(
        PostBgMusicService $postBgMusicService, UserAuthService $userAuthService,
        PostInfoFetchingService $postInfoFetchingService, EncryptionAndDecryptionService $encryptionAndDecryptionService
    ) {
        $this->postBgMusicService = $postBgMusicService;
        $this->userAuthService = $userAuthService;
        $this->postInfoFetchingService = $postInfoFetchingService;
        $this->encryptionAndDecryptionService = $encryptionAndDecryptionService;
        $this->redisClient = Redis::connection()->client();

        $this->gcsBgMusicOfPostsBucket = Storage::disk('gcsBgMusicForPostsBucket');
        $this->stringLabelToIntStatusCodeMappings = [
            "UNAUTHORIZED" => 403,
            "BAD_GATEWAY" => 502,
            "NOT_FOUND" => 404,
            "INTERNAL_SERVER_ERROR" => 500,
        ];
    }


    public function getBgMusicOfPost(Request $request, int $authUserId, string $overallPostId) {
        if ($authUserId < 0 && $authUserId !== -1) {
            return response('There does not exist a user with the provided userId. If you are just an anonymous guest,
            you must set the authUserId to -1.', 400);
        }
    
        if (!preg_match('/^[a-f\d]{24}$/i', $overallPostId)) {
            return response('The provided overallPostId is invalid.', 400);
        }

        $authUserIsAnonymousGuest = $authUserId == -1;

        if (!$authUserIsAnonymousGuest) {
            $userAuthenticationResult =  $userAuthService->authenticateUser(
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
                    $authToken,
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

        $authorsAndPostEncryptionStatusIfUserHasAccessToPost = $postInfoFetchingService->
        getPostEncryptionStatusIfUserHasAccessToPost(
            $authUserId,
            $overallPostId
        );
        if (isIndexedArray($authorsAndPostEncryptionStatusIfUserHasAccessToPost)) {
            return response(
                $authorsAndPostEncryptionStatusIfUserHasAccessToPost[0],
                $stringLabelToIntStatusCodeMappings[
                    $authorsAndPostEncryptionStatusIfUserHasAccessToPost[1]
                ],
            );  
        }

        $isEncrypted = $authorsAndPostEncryptionStatusIfUserHasAccessToPost;
        if ($isEncrypted) {
            try {
                $plaintextDataEncryptionKey =  $encryptionAndDecryptionService->getPlaintextDataEncryptionKeyOfPost(
                    $overallPostId, $this->redisClient
                );
            }
            catch (\Exception $e) {
                return response(
                    "There was trouble in the process of obtaining the encryptedDataEncryptionKey and decrypting
                    that in order to decrypt the relevant data of this encrypted post.",
                    500
                );
            }
        }

        $bgMusicAudio = $postBgMusicService->getPostsBgMusicIfExistsNullOtherwise(
            $this->gcsBgMusicOfPostsBucket, $overallPostId
        );
        if ($bgMusicAudio==null) {
            return response(
                "The background-music of this post does not exist",
                404
            );
        }
        else if (isIndexedArray($bgMusicAudio)) {
            return response(
                $bgMusicAudio[0],
                $stringLabelToIntStatusCodeMappings[
                    $bgMusicAudio[1]
                ],
            );  
        }

        $errorMessage = "";

        $postBgMusicInfo = $postBgMusicService->getMetadataOfPostsBgMusic(
            $overallPostId, $isEncrypted, $this->$redisClient
        );
        if (isIndexedArray($postBgMusicInfo)) {
            $postBgMusicInfo = null;
            $errorMessage .= $postBgMusicInfo[0];
        }
        $bgMusicOfPost = [];

        if ($isEncrypted && $postBgMusicInfo !== null) {
            $bgMusicOfPost['audio'] = $encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                $bgMusicAudio,
                $plaintextDataEncryptionKey,
                $postBgMusicInfo['audioEncryptionIv'],
                $postBgMusicInfo['audioEncryptionAuthTag']
            );

            $bgMusicOfPost['title'] = $encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                $postBgMusicInfo['encryptedTitle'],
                $plaintextDataEncryptionKey,
                $postBgMusicInfo['titleEncryptionIv'],
                $postBgMusicInfo['titleEncryptionAuthTag']
            );

            $bgMusicOfPost['artist'] = $encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
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
                    500
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
            'errorMessage' => $errorMessage,
            'bgMusicOfPost' => $bgMusicOfPost
        ], 200);
    }


    //Require MutualTLS
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
                $bgMusicAudio = $postBgMusicService->getPostsBgMusicIfExistsNullOtherwise(
                    $this->gcsBgMusicOfPostsBucket, $overallPostIdOfUnencryptedPost
                );

                if (isIndexedArray($bgMusicAudio)) {
                    $errorMessage.= "• " . $bgMusicAudio[0] . "\n";
                }
                else if ($bgMusicAudio !== null) {
                    $setOfOverallPostIdsOfUnencryptedPostsThatHaveBgMusic[] = $overallPostIdOfUnencryptedPost;
                    $overallPostIdsAndTheirBgMusic[$overallPostIdOfUnencryptedPost] = [
                        'audio' => $bgMusicAudio,
                        'title' => 'Unknown Title',
                        'artist' =>  'Unknown Artist',
                        'startTime' => 0,
                        'endTime' => -1
                    ];
                }
            }

            if (count($setOfOverallPostIdsOfUnencryptedPostsThatHaveBgMusic) > 0) {
                $resultOfGettingMetadataOfMultiplePosts = $postBgMusicService->
                getMetadataOfBgMusicOfMultiplePosts(
                    $setOfOverallPostIdsOfUnencryptedPostsThatHaveBgMusic,
                    false,
                    $this->redisClient
                );

                if (isIndexedArray($resultOfGettingMetadataOfMultiplePosts)) {
                    $errorMessage.= '• There was trouble getting the metadata of the background-music of
                    each of the unencrypted posts\n';
                }
                else {
                    foreach($resultOfGettingMetadataOfMultiplePosts as $bgMusicMetadataOfUnencryptedPost) {
                        $overallPostId = $bgMusicMetadataOfUnencryptedPost['overallPostId'];

                        $overallPostIdsAndTheirBgMusic[$overallPostId] = [
                            'audio' => $overallPostIdsAndTheirBgMusic[$overallPostId]['audio'],
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
            foreach ($setOfOverallPostIdsOfEncryptedPosts as $overallPostIdOfEncryptedPost) {
                $bgMusicAudio = $postBgMusicService->getPostsBgMusicIfExistsNullOtherwise(
                    $this->gcsBgMusicOfPostsBucket, $overallPostIdOfEncryptedPost
                );

                if (isIndexedArray($bgMusicAudio)) {
                    $errorMessage.= "• " . $bgMusicAudio[0] . "\n";
                }
                else if ($bgMusicAudio !== null) {
                    $setOfOverallPostIdsOfEncryptedPostsThatHaveBgMusic[] = $overallPostIdOfEncryptedPost;
                    $overallPostIdsAndTheirBgMusic[$overallPostIdOfEncryptedPost] = [
                        'audio' => $bgMusicAudio
                    ];
                }
            }

            if (count($setOfOverallPostIdsOfEncryptedPostsThatHaveBgMusic) > 0) {
                $resultOfGettingMetadataOfMultiplePosts = $postBgMusicService->
                getMetadataOfBgMusicOfMultiplePosts(
                    $setOfOverallPostIdsOfEncryptedPostsThatHaveBgMusic,
                    true,
                    $this->redisClient
                );

                if (isIndexedArray($resultOfGettingMetadataOfMultiplePosts)) {
                    $errorMessage.= '• There was trouble getting the metadata of the background-music of
                    each of the encrypted posts\n';

                    foreach ($setOfOverallPostIdsOfEncryptedPostsThatHaveBgMusic as $keyToRemove) {
                        unset($overallPostIdsAndTheirBgMusic[$keyToRemove]);
                    }
                }
                else {
                    foreach($resultOfGettingMetadataOfMultiplePosts as $bgMusicMetadataOfEncryptedPost) {
                        $overallPostIdOfEncryptedPost = $bgMusicMetadataOfEncryptedPost['overallPostId'];
                        
                        $overallPostIdsAndTheirBgMusic[$overallPostIdOfEncryptedPost]['audio'] =
                        $encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                            $overallPostIdsAndTheirBgMusic[$overallPostIdOfEncryptedPost]['audio'],
                            $plaintextDataEncryptionKey,
                            $bgMusicMetadataOfEncryptedPost['audioEncryptionIv'],
                            $bgMusicMetadataOfEncryptedPost['audioEncryptionAuthTag']
                        );
    
                        $overallPostIdsAndTheirBgMusic[$overallPostIdOfEncryptedPost]['title'] =
                        $encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                            $bgMusicMetadataOfEncryptedPost['encryptedTitle'],
                            $plaintextDataEncryptionKey,
                            $bgMusicMetadataOfEncryptedPost['titleEncryptionIv'],
                            $bgMusicMetadataOfEncryptedPost['titleEncryptionAuthTag']
                        );
    
                        $overallPostIdsAndTheirBgMusic[$overallPostIdOfEncryptedPost]['artist'] =
                        $encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                            $bgMusicMetadataOfEncryptedPost['encryptedArtist'],
                            $plaintextDataEncryptionKey,
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


    //Require MutualTLS
    public function addBgMusicToPost(Request $request, int $authUserId, string $overallPostId,
    $isEncrypted) {
        $bgMusicAudioFile = request()->file('bgMusicAudioFile');
        $bgMusicAudioFileBuffer = file_get_contents($bgMusicAudioFile->getRealPath());

        $postBgMusicInfo = $postBgMusicService->getMetadataOfPostsBgMusic(
            $overallPostId, $isEncrypted, $this->$redisClient
        );
        if (isIndexedArray($postBgMusicInfo)) {
            return response(
                "There was trouble checking whether or not the provided post already has background
                -music",
                500
            );
        }
        else if ($postBgMusicInfo !== null) {
            return response("You are trying to add background-music to a post that already has
            background-music", 409);
        }

        $plaintextDataEncryptionKey = [];

        if ($isEncrypted) {
            try {
                $plaintextDataEncryptionKey =  $encryptionAndDecryptionService->getPlaintextDataEncryptionKeyOfPost(
                    $overallPostId, $this->redisClient
                );
            }
            catch (\Exception $e) {
                return response(
                    "There was trouble in the process of obtaining the encryptedDataEncryptionKey and decrypting
                    that in order to encrypt the relevant data of this encrypted post.",
                    500
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
            $audioEncryptionInfo = $encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                $bgMusicAudioFileBuffer, $plaintextDataEncryptionKey
            );
            $encryptedBgMusicAudioFileBuffer = $audioEncryptionInfo[0];

            try {
                $this->gcsBgMusicOfPostsBucket->put(
                    $overallPostId . '.mp3', $encryptedBgMusicAudioFileBuffer
                );
            }
            catch (\Exception $e) {
                $errorMessage .= "• There was trouble adding the encrypted audio-file into the database.\n";
                return response($errorMessage, 500);
            }

            $postBgMusicInfo['audioEncryptionIv'] = $audioEncryptionInfo[1];
            $postBgMusicInfo['audioEncryptionAuthTag'] = $audioEncryptionInfo[2];

            $titleEncryptionInfo = $encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                $postBgMusicInfo['title'], $plaintextDataEncryptionKey
            );
            $postBgMusicInfo['encryptedTitle'] = $titleEncryptionInfo[0];
            $postBgMusicInfo['titleEncryptionIv'] = $titleEncryptionInfo[1];
            $postBgMusicInfo['titleEncryptionAuthTag'] = $titleEncryptionInfo[2];

            $artistEncryptionInfo = $encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
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
            catch (\Exception $e) {
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
            catch (\Exception $e) {
                $errorMessage .= "• There was trouble adding the audio-file into the database.\n";
                return response($errorMessage, 500);
            }

            try {
                UnencryptedPostBgMusicInfo::Create(
                    $postBgMusicInfo
                ); 
            }
            catch (\Exception $e) {
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
        catch (\Exception $e) {
            $errorMessage .= "• There was trouble caching the metadata of the post's newly added
            background-music\n";
        }

        return response.json([
            'errorMessage' => $errorMessage
        ], 200);
    }


    //Require MutualTLS
    public function addEncryptionInfoForBgMusicAndVidSubsOfNewlyUploadedEncryptedPost(
        string $overallPostId
    ) {
        $newCMKWasSuccessfullyCreated = $encryptionAndDecryptionService->createNewCustomerMasterKey(
            $overallPostId
        );

        if (!$newCMKWasSuccessfullyCreated) {
            return response(
                'There was trouble creating the new GCP CMK for encrypting the data-encryption-key
                of the vid-subs and background-music of this encrypted post',
                500
            );
        }

        $encryptedDataEncryptionKey = null;
        try {
            $resultOfCreatingAndEncryptingDEK = $encryptionAndDecryptionService->
            createAndEncryptNewDataEncryptionKey(
                $overallPostId
            );
            
            $encryptedDataEncryptionKey = $resultOfCreatingAndEncryptingDEK[1];
        }
        catch (\Exception $e) {
            return response(
                "There was trouble encrypting the newly generated data-encryption-key for the
                vid-subs and background-music of this encrypted post",
                500
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
        catch (\Exception $e) {
            return response(
                "There was trouble adding the encryption-info into the database",
                500
            );
        }
    }


    //Require MutualTLS
    public function updateBgMusicOfPost(Request $request, int $authUserId, string $overallPostId,
    bool $isEncrypted) {
        $bgMusicAudioFile = request()->file('bgMusicAudioFile');
        $bgMusicAudioFileBuffer = null;
        if ($bgMusicAudioFile !== null) {
            $bgMusicAudioFileBuffer = file_get_contents($bgMusicAudioFile->getRealPath());
        }

        $plaintextDataEncryptionKey = [];

        $postBgMusicInfo = $postBgMusicService->getMetadataOfPostsBgMusic(
            $overallPostId, $isEncrypted, $this->$redisClient
        );
        if (isIndexedArray($postBgMusicInfo)) {
            return response(
                "There was trouble checking whether or not the provided post already has background
                -music",
                500
            );
        }
        else if ($postBgMusicInfo == null) {
            return response("No background-music exists in the post for you to update", 404);
        }

        if ($isEncrypted) {
            try {
                $plaintextDataEncryptionKey =  $encryptionAndDecryptionService->getPlaintextDataEncryptionKeyOfPost(
                    $overallPostId, $this->redisClient
                );
            }
            catch (\Exception $e) {
                return response(
                    "There was trouble in the process of obtaining the encryptedDataEncryptionKey and decrypting
                    that in order to encrypt the updated data of this encrypted post.",
                    500
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
                $audioEncryptionInfo = $encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                    $bgMusicAudioFileBuffer, $plaintextDataEncryptionKey
                );
                $encryptedBgMusicAudioFileBuffer = $audioEncryptionInfo[0];
    
                try {
                    $this->gcsBgMusicOfPostsBucket->put(
                        $overallPostId . '.mp3', $encryptedBgMusicAudioFileBuffer
                    );
                    $bgMusicWasUpdatedSuccessfully = true;
                }
                catch (\Exception $e) {
                    $errorMessage .= "• There was trouble updating the audio-file of the post's background
                    -music.\n";
                }
            }

            if ($bgMusicWasUpdatedSuccessfully) {
                $postBgMusicInfo['audioEncryptionIv'] = $audioEncryptionInfo[1];
                $postBgMusicInfo['audioEncryptionAuthTag'] = $audioEncryptionInfo[2];
            }

            if (array_key_exists('title', $postBgMusicInfo)) {
                $titleEncryptionInfo = $encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                    $postBgMusicInfo['title'], $plaintextDataEncryptionKey
                );
                $postBgMusicInfo['encryptedTitle'] = $titleEncryptionInfo[0];
                $postBgMusicInfo['titleEncryptionIv'] = $titleEncryptionInfo[1];
                $postBgMusicInfo['titleEncryptionAuthTag'] = $titleEncryptionInfo[2];
                unset($postBgMusicInfo['title']);
            }

            if (array_key_exists('artist', $postBgMusicInfo)) {
                $artistEncryptionInfo = $encryptionAndDecryptionService->encryptDataWithDataEncryptionKey(
                    $postBgMusicInfo['artist'], $plaintextDataEncryptionKey
                );
                $postBgMusicInfo['encryptedArtist'] = $artistEncryptionInfo[0];
                $postBgMusicInfo['artistEncryptionIv'] = $artistEncryptionInfo[1];
                $postBgMusicInfo['artistEncryptionAuthTag'] = $artistEncryptionInfo[2];
                unset($postBgMusicInfo['artist']);
            }

            try {
                $newPostBgMusicInfo = EncryptedPostBgMusicInfo
                    ::where('overallPostId', $overallPostId)
                    ->update($postBgMusicInfo);
            }
            catch (\Exception $e) {
                $errorMessage .= "• There was trouble updating the metadata of the post's background-
                music.\n";
                if ($bgMusicWasUpdatedSuccessfully) {
                    return response($errorMessage, 500);
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
                catch (\Exception $e) {
                    $errorMessage .= "• There was trouble updating the audio-file of the background-music of the
                    post.\n";
                }
            }

            try {
                $newPostBgMusicInfo = UnencryptedPostBgMusicInfo
                    ::where('overallPostId', $overallPostId)
                    ->update($postBgMusicInfo);
            }
            catch (\Exception $e) {
                $errorMessage .= "• There was trouble updating the metadata of the post's background-
                music.\n";
            } 
        }

        try {
            $this->redisClient->del("bgMusicMetadataForPost$overallPostId");
        }
        catch (\Exception $e) {
            $errorMessage .= '• There was trouble deleting the original bgMusic-metadata from the
            cache.\n';
            return response($errorMessage, 500);

        }

        return response.json([
            'errorMessage' => $errorMessage
        ], 200);
    }


    //Require MutualTLS
    public function removeBgMusicFromPost(Request $request, int $authUserId, string $overallPostId,
    bool $isEncrypted) {
        $audioFileNameToDelete = $overallPostId . '.mp3';

        try {
            if ($this->gcsBgMusicOfPostsBucket->exists($audioFileNameToDelete)) {
                //pass
            }
            else {
                return false;
            }
        }
        catch (\Exception $e) {
            //pass
        }

        try {
            $this->gcsBgMusicOfPostsBucket->delete($audioFileNameToDelete);
        }
        catch (\Exception $e) {
            return response('There was trouble deleting the audio-file from the database', 500);
        }

        if ($isEncrypted) {
            try {
                $numRowsDeleted = EncryptedPostBgMusicInfo
                    ::where('overallPostId', $overallPostId)
                    ->delete();
        
                return response()->json($numRowsDeleted==1, 200);
            }
            catch (\Exception $e) {
                return response('There was trouble deleting the encrypted background-music metadata from
                the database', 500);
            }
        }
        else {
            try {
                $numRowsDeleted = UnencryptedPostBgMusicInfo
                    ::where('overallPostId', $overallPostId)
                    ->delete();
        
                return response()->json($numRowsDeleted==1, 200);
            }
            catch (\Exception $e) {
                return response('There was trouble deleting the unencrypted background-music metadata
                from the database.', 500);
            }
        }

        try {
            $this->redisClient->del("bgMusicMetadataForPost$overallPostId");
        }
        catch (\Exception $e) {
            return response('There was trouble deleting the post\'s cached bg-music Metadata.', 500);
        }

        return response()->json(true, 200);
    }


    private function isIndexedArray($array) {
        if (!is_array($array)) {
            return false;
        }
        return array_keys($array) === range(0, count($array) - 1);
    }
}