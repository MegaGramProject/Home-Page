<?php

namespace App\Services;

use App\Models\Cassandra\EncryptedPostVidSubtitlesInfo;


class PostVidSubtitlesService {


    public function getPostsVidSubtitleFiles($s3VidSubtitlesForPostsBucket, $overallPostId) {
        try {
            $namesOfVidSubtitleFilesOfAllPosts = $s3VidSubtitlesForPostsBucket->files('');

            $namesOfAllVidSubtitleFilesOfPost = array_filter($namesOfVidSubtitleFilesOfAllPosts, function ($fileName)
            use ($overallPostId) {
                return str_starts_with($fileName, $overallPostId);
            });

            $output = [];
            foreach($namesOfAllVidSubtitleFilesOfPost as $nameOfVidSubtitleFileOfPost) {
                $infoOnVidSubtitleFileOfPost = [];
                $partsOfNameOfVidSubtitleFileOfPost = explode('/', $nameOfVidSubtitleFileOfPost); 

                $infoOnVidSubtitleFileOfPost['slideNumber'] = $partsOfNameOfVidSubtitleFileOfPost[1];
                $infoOnVidSubtitleFileOfPost['langCode'] = $partsOfNameOfVidSubtitleFileOfPost[2];
                if (count($partsOfNameOfVidSubtitleFileOfPost) == 4) {
                    $infoOnVidSubtitleFileOfPost['isDefault'] = true;
                }

                $infoOnVidSubtitleFileOfPost['subtitles'] = $s3VidSubtitlesForPostsBucket->get($nameOfVidSubtitleFileOfPost);

                $output[] = $infoOnVidSubtitleFileOfPost;
            }

            return $output;
        }
        catch (\Exception) {
            return [
                "There was trouble getting the subtitle-files of post $overallPostId",
                "BAD_GATEWAY"
            ];
        }
    }


    public function getVidSubtitleFilesOfMultiplePosts($namesOfVidSubtitleFilesOfAllPostsInQuestion, $s3VidSubtitlesForPostsBucket) {
        try {
            $overallPostIdsAndTheirVidSubtitles = [];
            foreach($namesOfVidSubtitleFilesOfAllPostsInQuestion as $nameOfVidSubtitleFileOfPost) {
                $infoOnVidSubtitleFileOfPost = [];
                $partsOfNameOfVidSubtitleFileOfPost = explode('/', $nameOfVidSubtitleFileOfPost); 

                $overallPostId = $partsOfNameOfVidSubtitleFileOfPost[0];
                $infoOnVidSubtitleFileOfPost['slideNumber'] = $partsOfNameOfVidSubtitleFileOfPost[1];
                $infoOnVidSubtitleFileOfPost['langCode'] = $partsOfNameOfVidSubtitleFileOfPost[2];
                if (count($partsOfNameOfVidSubtitleFileOfPost) == 4) {
                    $infoOnVidSubtitleFileOfPost['isDefault'] = true;
                }

                $infoOnVidSubtitleFileOfPost['subtitles'] = $s3VidSubtitlesForPostsBucket->get($nameOfVidSubtitleFileOfPost);

                if (!array_key_exists($overallPostId, $overallPostIdsAndTheirVidSubtitles)) {
                    $overallPostIdsAndTheirVidSubtitles[$overallPostId] = [];
                }

                $overallPostIdsAndTheirVidSubtitles[$overallPostId][] = $infoOnVidSubtitleFileOfPost;
            }

            return $overallPostIdsAndTheirVidSubtitles;
        }
        catch (\Exception) {
            return [
                "There was trouble getting the subtitle-files of each of the posts",
                "BAD_GATEWAY"
            ];
        }
    }


    public function getEncryptionInfoOfVidSubtitleFilesOfPost($redisClient, $overallPostId, $allVidSubtitlesOfPost) {
        $encryptionInfoOfEachSubtitleFileOfPostAsOrganizedDict = [];

        try {
            $redisResults = $redisClient->pipeline(function ($pipe) use ($allVidSubtitlesOfPost, $overallPostId) {
                foreach ($allVidSubtitlesOfPost as $vidSubtitlesOfPost) {
                    $slideNumber = $vidSubtitlesOfPost['slideNumber'];
                    $langCode = $vidSubtitlesOfPost['langCode'];
    
                    $pipe->hGetAll(
                        "encryptedVidSubtitlesInfoForPost{$overallPostId}@slideNumber{$slideNumber}@langCode{$langCode}"
                    );
                }
            });

            $newAllVidSubtitlesOfPost = [];

            for ($i = 0; $i < count($redisResults); $i++) {
                $redisResult = $redisResults[$i];
                $vidSubtitlesOfPost = $allVidSubtitlesOfPost[$i];

                if (array_key_exists('fileEncryptionIv', $redisResult)) {
                    $slideNumber = $vidSubtitlesOfPost['slideNumber'];
                    $langCode = $vidSubtitlesOfPost['langCode'];

                    if (!array_key_exists($slideNumber, $encryptionInfoOfEachSubtitleFileOfPostAsOrganizedDict)) {
                        $encryptionInfoOfEachSubtitleFileOfPostAsOrganizedDict[$slideNumber] = [];
                    }

                    $encryptionInfoOfEachSubtitleFileOfPostAsOrganizedDict[$slideNumber][$langCode] = [
                        'iv' => $redisResult['fileEncryptionIv'],
                        'authTag' => $redisResult['fileEncryptionAuthTag']
                    ];
                }
                else {
                    $newAllVidSubtitlesOfPost[] = $allVidSubtitlesOfPost[$i];
                }
            }

            if (count($newAllVidSubtitlesOfPost) == 0) {
                return $encryptionInfoOfEachSubtitleFileOfPostAsOrganizedDict;
            }

            $allVidSubtitlesOfPost = $newAllVidSubtitlesOfPost;
        }
        catch (\Exception) {
            //pass
        }

        $nonRedisResults = null;

        try {
            $nonRedisResults = EncryptedPostVidSubtitlesInfo
                ::where('overallPostId', $overallPostId)
                ->get()
                ->toArray(); 
            
            for ($i = 0; $i < count($nonRedisResults); $i++) {
                $nonRedisResult = $nonRedisResults[$i];
                $slideNumber = $nonRedisResult->slideNumber;
                $langCode = $nonRedisResult->langCode;
                $fileEncryptionIv = $nonRedisResult->fileEncryptionIv;
                $fileEncryptionAuthTag = $nonRedisResult->fileEncryptionAuthTag;

                $nonRedisResults[$i] = [
                    'overallPostId' => $nonRedisResult->overallPostId,
                    'slideNumber' => $slideNumber,
                    'langCode' => $langCode,

                    'fileEncryptionIv' => $fileEncryptionIv,
                    'fileEncryptionAuthTag' => $fileEncryptionAuthTag
                ];

                if (!array_key_exists($slideNumber, $encryptionInfoOfEachSubtitleFileOfPostAsOrganizedDict)) {
                    $encryptionInfoOfEachSubtitleFileOfPostAsOrganizedDict[$slideNumber] = [];
                }

                $encryptionInfoOfEachSubtitleFileOfPostAsOrganizedDict[$slideNumber][$langCode] = [
                    'iv' => $fileEncryptionIv,
                    'authTag' => $fileEncryptionAuthTag
                ];
            }
        }
        catch (\Exception) {
            return [
                "There was trouble getting the relevant info for decrypting the vid-subtitle-files of encrypted post
                $overallPostId",
                'BAD_GATEWAY'
            ];
        }

        try {
            $redisClient->pipeline(function ($pipe) use ($nonRedisResults) {
                foreach ($nonRedisResults as $nonRedisResult) {
                    $overallPostIdOfNonRedisResult = $nonRedisResult['overallPostId'];
                    $slideNumberOfNonRedisResult = $nonRedisResult['slideNumber'];
                    $langCodeOfNonRedisResult = $nonRedisResult['langCode'];
    
                    unset($nonRedisResult['overallPostId']);
                    unset($nonRedisResult['slideNumber']);
                    unset($nonRedisResult['langCode']);
    
                    $pipe->hMSet(
                        "encryptedVidSubtitlesInfoForPost{$overallPostIdOfNonRedisResult}@slideNumber{$slideNumberOfNonRedisResult}
                        @langCode{$langCodeOfNonRedisResult}",
                        $nonRedisResult
                    );
                }
            });
        }
        catch (\Exception) {
            //pass
        }
        
        return $encryptionInfoOfEachSubtitleFileOfPostAsOrganizedDict;
    }


    public function getEncryptionInfoOfVidSubtitleFilesOfMultiplePosts($redisClient, $setOfOverallPostIdsOfEncryptedPosts,
    $overallPostIdsAndTheirVidSubtitles) {

        $encryptionInfoOfEachSubtitleFileOfEachPostAsOrganizedDict = [];
        $allVidSubtitlesOfPostsInList = [];

        try {
            $redisResults = $redisClient->pipeline(function ($pipe) use ($setOfOverallPostIdsOfEncryptedPosts,
            $overallPostIdsAndTheirVidSubtitles) {
                foreach($setOfOverallPostIdsOfEncryptedPosts as $overallPostIdOfEncryptedPost) {
                    $allVidSubtitlesOfPost = $overallPostIdsAndTheirVidSubtitles[$overallPostIdOfEncryptedPost];
                    foreach ($allVidSubtitlesOfPost as $vidSubtitlesOfPost) {
                        $slideNumber = $vidSubtitlesOfPost['slideNumber'];
                        $langCode = $vidSubtitlesOfPost['langCode'];
        
                        $pipe->hGetAll(
                            "encryptedVidSubtitlesInfoForPost{$overallPostIdOfEncryptedPost}@slideNumber{$slideNumber}@langCode{$langCode}"
                        );
    
                        $allVidSubtitlesOfPostsInList[] = [
                            'overallPostId' => $overallPostIdOfEncryptedPost,
                            'slideNumber' => $slideNumber,
                            'langCode' => $langCode
                        ];
                    }
                }
            });

            $newAllVidSubtitlesOfPostsInList = [];

            for ($i = 0; $i < count($redisResults); $i++) {
                $redisResult = $redisResults[$i];
                $vidSubtitlesOfPost = $allVidSubtitlesOfPostsInList[$i];

                if (array_key_exists('fileEncryptionIv', $redisResult)) {
                    $overallPostId = $vidSubtitlesOfPost['overallPostId'];
                    $slideNumber = $vidSubtitlesOfPost['slideNumber'];
                    $langCode = $vidSubtitlesOfPost['langCode'];

                    if (!array_key_exists($overallPostId, $encryptionInfoOfEachSubtitleFileOfEachPostAsOrganizedDict)) {
                        $encryptionInfoOfEachSubtitleFileOfEachPostAsOrganizedDict[$overallPostId] = [];
                    }

                    if (!array_key_exists($slideNumber, $encryptionInfoOfEachSubtitleFileOfEachPostAsOrganizedDict
                    [$overallPostId])) {
                        $encryptionInfoOfEachSubtitleFileOfEachPostAsOrganizedDict[$overallPostId][$slideNumber] = [];
                    }

                    $encryptionInfoOfEachSubtitleFileOfEachPostAsOrganizedDict[$overallPostId][$slideNumber][$langCode] = [
                        'fileEncryptionIv' => $redisResult['fileEncryptionIv'],
                        'fileEncryptionAuthTag' => $redisResult['fileEncryptionAuthTag']
                    ];
                }
                else {
                    $newAllVidSubtitlesOfPostsInList[] = $allVidSubtitlesOfPostsInList[$i];
                }
            }

            if (count($newAllVidSubtitlesOfPostsInList) == 0) {
                return $encryptionInfoOfEachSubtitleFileOfEachPostAsOrganizedDict;
            }

            $allVidSubtitlesOfPostsInList = $newAllVidSubtitlesOfPostsInList;
        }
        catch (\Exception) {
            //pass
        }

        $nonRedisResults = [];
        try {
            foreach ($allVidSubtitlesOfPostsInList as $vidSubtitlesOfPost) {
                $overallPostId = $vidSubtitlesOfPost['overallPostId'];
                $slideNumber = $vidSubtitlesOfPost['slideNumber'];
                $langCode = $vidSubtitlesOfPost['langCode'];

                $nonRedisResult = EncryptedPostVidSubtitlesInfo
                    ::where('overallPostId', $overallPostId)
                    ::where('slideNumber', $slideNumber)
                    ::where('langCode', $langCode)
                    ->get(); 
                
                $fileEncryptionIv = $nonRedisResult->fileEncryptionIv;
                $fileEncryptionAuthTag = $nonRedisResult->fileEncryptionAuthTag;
                
                $nonRedisResults[] = [
                    'overallPostId' => $overallPostId,
                    'slideNumber' => $slideNumber,
                    'langCode' => $langCode,

                    'fileEncryptionIv' => $fileEncryptionIv,
                    'fileEncryptionAuthTag' => $fileEncryptionAuthTag
                ];

                if (!array_key_exists($overallPostId, $encryptionInfoOfEachSubtitleFileOfEachPostAsOrganizedDict)) {
                    $encryptionInfoOfEachSubtitleFileOfEachPostAsOrganizedDict[$overallPostId] = [];
                }

                if (!array_key_exists($slideNumber, $encryptionInfoOfEachSubtitleFileOfEachPostAsOrganizedDict
                [$overallPostId])) {
                    $encryptionInfoOfEachSubtitleFileOfEachPostAsOrganizedDict[$overallPostId][$slideNumber] = [];
                }

                $encryptionInfoOfEachSubtitleFileOfEachPostAsOrganizedDict[$overallPostId][$slideNumber][$langCode] = [
                    'fileEncryptionIv' => $fileEncryptionIv,
                    'fileEncryptionAuthTag' => $fileEncryptionAuthTag
                ];
            }
        }
        catch (\Exception) {
            return [
                "There was trouble getting the relevant info for decrypting the vid-subtitle-files of the encrypted posts",
                'BAD_GATEWAY'
            ];
        }

        try {
            $redisClient->pipeline(function ($pipe) use ($nonRedisResults) {
                foreach ($nonRedisResults as $nonRedisResult) {
                    $overallPostIdOfNonRedisResult = $nonRedisResult['overallPostId'];
                    $slideNumberOfNonRedisResult = $nonRedisResult['slideNumber'];
                    $langCodeOfNonRedisResult = $nonRedisResult['langCode'];
    
                    unset($nonRedisResult['overallPostId']);
                    unset($nonRedisResult['slideNumber']);
                    unset($nonRedisResult['langCode']);
    
                    $pipe->hMSet(
                        "encryptedVidSubtitlesInfoForPost{$overallPostIdOfNonRedisResult}@slideNumber{$slideNumberOfNonRedisResult}
                        @langCode{$langCodeOfNonRedisResult}",
                        $nonRedisResult
                    );
                }
            });

            
        }
        catch (\Exception) {
            //pass
        }
        
        return $encryptionInfoOfEachSubtitleFileOfEachPostAsOrganizedDict;
    }


    public function getRudimentaryInfoOnVidSubtitlesOfPost(string $overallPostId, $s3VidSubtitlesForPostsBucket) {
        $output = [];

        try {
            $namesOfVidSubtitleFilesOfAllPosts = $s3VidSubtitlesForPostsBucket->files('');

            $namesOfAllVidSubtitleFilesOfPost = array_filter($namesOfVidSubtitleFilesOfAllPosts, function ($fileName)
            use ($overallPostId) {
                return str_starts_with($fileName, $overallPostId);
            });

            foreach($namesOfAllVidSubtitleFilesOfPost as $nameOfVidSubtitleFileOfPost) {
                $partsOfNameOfVidSubtitleFileOfPost = explode('/', $nameOfVidSubtitleFileOfPost); 
                $slideNumber = $partsOfNameOfVidSubtitleFileOfPost[1];
                $langCode = $partsOfNameOfVidSubtitleFileOfPost[2];
                
                if (!array_key_exists($slideNumber, $output)) {
                    $output[$slideNumber] = [
                        'default' => null
                    ];
                }

                $output[$slideNumber][$langCode] = null;

                if (count($partsOfNameOfVidSubtitleFileOfPost) == 4) {
                    $output[$slideNumber]['default'] = $langCode;
                }
            }

            return $output;
        }
        catch (\Exception) {
            return [
                "There was trouble getting the names of all the vid-subtitle files of post $overallPostId",
                'BAD_GATEWAY'
            ];
        }
    }
}