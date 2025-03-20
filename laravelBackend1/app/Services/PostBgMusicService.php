<?php

namespace App\Services;

use App\Models\Oracle\PostBgMusicInfo\UnencryptedPostBgMusicInfo;
use App\Models\Oracle\PostBgMusicInfo\EncryptedPostBgMusicInfo;


class PostBgMusicService {


    public function getMetadataOfPostsBgMusic(string $overallPostId, bool $isEncrypted, $redisClient) {
        try {
            $postBgMusicInfo = $redisClient->hGetAll("bgMusicMetadataForPost$overallPostId");
            if (array_key_exists('startTime', $postBgMusicInfo)) {
                $postBgMusicInfo["startTime"] = (float) $postBgMusicInfo["startTime"];
                $postBgMusicInfo["endTime"] = (float) $postBgMusicInfo["endTime"];
                return $postBgMusicInfo;
            }
        }
        catch (\Exception) {
            //pass
        }

        try {
            if ($isEncrypted) {
                $postBgMusicInfo = EncryptedPostBgMusicInfo
                    ::where('overallPostId', $overallPostId)
                    ->first(); 
                
                if ($postBgMusicInfo == null) {
                    return null;
                }
                
                $postBgMusicInfo = [
                    'audioEncryptionIv' => $postBgMusicInfo->audioEncryptionIv,
                    'audioEncryptionAuthTag' => $postBgMusicInfo->audioEncryptionAuthTag,

                    'encryptedTitle' => $postBgMusicInfo->encryptedTitle,
                    'titleEncryptionIv' => $postBgMusicInfo->titleEncryptionIv,
                    'titleEncryptionAuthTag' => $postBgMusicInfo->titleEncryptionAuthTag,

                    'encryptedArtist' => $postBgMusicInfo->encryptedArtist,
                    'artistEncryptionIv' => $postBgMusicInfo->artistEncryptionIv,
                    'artistEncryptionAuthTag' => $postBgMusicInfo->artistEncryptionAuthTag,

                    'startTime' => strval($postBgMusicInfo->startTime),
                    'endTime' => strval($postBgMusicInfo->endTime),
                ];

                try {
                    $redisClient->hMSet("bgMusicMetadataForPost$overallPostId", $postBgMusicInfo);
                }
                catch (\Exception) {
                    //pass
                } 
            }
            else {
                $postBgMusicInfo = UnencryptedPostBgMusicInfo
                    ::where('overallPostId', $overallPostId)
                    ->first(); 
                
                if ($postBgMusicInfo == null) {
                    return null;
                }
                
                $postBgMusicInfo = [
                    9
                ];

                try {
                    $redisClient->hMSet("bgMusicMetadataForPost$overallPostId", $postBgMusicInfo);
                }
                catch (\Exception) {
                    //pass
                }
            }
        }
        catch (\Exception) {
            return [
                "There was trouble getting the relevant info for the background-music of post
                $overallPostId",
                'BAD_GATEWAY'
            ];
        }

        $postBgMusicInfo['startTime'] = (float) $postBgMusicInfo['startTime'];
        $postBgMusicInfo['endTime'] = (float) $postBgMusicInfo['endTime'];
        
        return $postBgMusicInfo;
    }


    public function getMetadataOfBgMusicOfMultiplePosts(array $overallPostIds, bool $allAreEncrypted, $redisClient) {
        $bgMusicInfos = [];

        try {
            $redisResults = $redisClient->pipeline(function ($pipe) use ($overallPostIds) {
                foreach ($overallPostIds as $overallPostId) {
                    $pipe->hGetAll("bgMusicMetadataForPost$overallPostId");
                }
            });

            $newOverallPostIds = [];

            for ($i = 0; $i < count($redisResults); $i++) {
                $phpRedisResult = $redisResults[$i];
                if (array_key_exists('startTime', $phpRedisResult)) {
                    $bgMusicInfo = [];

                    foreach ($phpRedisResult as $key => $value) {
                        if ($key === 'startTime' || $key === 'endTime') {
                            $bgMusicInfo[$key] = (float) $value;
                        }
                        else {
                            $bgMusicInfo[$key] = $value;
                        }
                    }

                    $bgMusicInfos[] = $bgMusicInfo;
                }
                else {
                    $newOverallPostIds[] = $overallPostIds[$i];
                }
            }

            if (count($newOverallPostIds) == 0) {
                return $bgMusicInfos;
            }

            $overallPostIds = $newOverallPostIds;
        }
        catch (\Exception) {
            //pass
        }

        $nonRedisResults = null;

        try {
            if ($allAreEncrypted) {
                $nonRedisResults = EncryptedPostBgMusicInfo
                    ::whereIn('overallPostId', $overallPostIds)
                    ->get()
                    ->toArray(); 
                
                
                for ($i = 0; $i < count($nonRedisResults); $i++) {
                    $nonRedisResult = $nonRedisResults[$i];
                    $nonRedisResults[$i] = [
                        'overallPostId' => $nonRedisResult->overallPostId,

                        'audioEncryptionIv' => $nonRedisResult->audioEncryptionIv,
                        'audioEncryptionAuthTag' => $nonRedisResult->audioEncryptionAuthTag,
    
                        'encryptedTitle' => $nonRedisResult->encryptedTitle,
                        'titleEncryptionIv' => $nonRedisResult->titleEncryptionIv,
                        'titleEncryptionAuthTag' => $nonRedisResult->titleEncryptionAuthTag,
    
                        'encryptedArtist' => $nonRedisResult->encryptedArtist,
                        'artistEncryptionIv' => $nonRedisResult->artistEncryptionIv,
                        'artistEncryptionAuthTag' => $nonRedisResult->artistEncryptionAuthTag,
    
                        'startTime' => strval($nonRedisResult->startTime),
                        'endTime' => strval($nonRedisResult->endTime)
                    ];
                }
            }
            else {
                $nonRedisResults = UnencryptedPostBgMusicInfo
                    ::whereIn('overallPostId', $overallPostIds)
                    ->get()
                    ->toArray(); 
                
                for ($i = 0; $i < count($nonRedisResults); $i++) {
                    $nonRedisResult = $nonRedisResults[$i];
                    $nonRedisResults[$i] = [
                        'overallPostId' => $nonRedisResult->overallPostId,
    
                        'title' => $nonRedisResult->title,
                        'artist' => $nonRedisResult->artist,
    
                        'startTime' => strval($nonRedisResult->startTime),
                        'endTime' => strval($nonRedisResult->endTime)
                    ];
                }
            }
        }
        catch (\Exception) {
            return [
                "There was trouble getting the relevant info for the background-music of the list of
                posts",
                'BAD_GATEWAY'
            ];
        }

        try {
            $redisClient->pipeline(function ($pipe) use ($nonRedisResults) {
                foreach ($nonRedisResults as $nonRedisResult) {
                    $overallPostIdOfNonRedisResult = $nonRedisResult['overallPostId'];
                    unset($nonRedisResult['overallPostId']);
    
                    $pipe->hMSet(
                        "bgMusicMetadataForPost$overallPostIdOfNonRedisResult",
                        $nonRedisResult
                    );
                }
            });
        }
        catch (\Exception) {
            //pass
        }
        
        for ($i = 0; $i < count($nonRedisResults); $i++) {
            $nonRedisResult = $nonRedisResults[$i];
            $nonRedisResult['startTime'] = (float) $nonRedisResult['startTime'];
            $nonRedisResult['endTime'] = (float) $nonRedisResult['endTime'];
            $bgMusicInfos[] = $nonRedisResult;
        }
        return $bgMusicInfos;
    }


    public function getPostsBgMusicIfExistsNullOtherwise($gcsBgMusicOfPostsBucket, string $overallPostId) {
        $bgMusicFilePath = $overallPostId . '.mp3';

        try {
            $thisPostHasBgMusic = $gcsBgMusicOfPostsBucket->exists($bgMusicFilePath);
            if (!$thisPostHasBgMusic) {
                return null;
            }
        }
        catch (\Exception) {
            return [
                "There was trouble checking whether or not post $overallPostId has background-music
                associated with it",
                'BAD_GATEWAY'
            ];
        }

        try {
            $postBgMusicAudio = $gcsBgMusicOfPostsBucket->get($bgMusicFilePath);
            return $postBgMusicAudio;
        }
        catch (\Exception) {
            return [
                "There was trouble getting the audio-file of the background-music of post $overallPostId",
                'BAD_GATEWAY'
            ];
        }
    }
}