<?php

namespace App\Services;

use App\Models\Oracle\PostBgMusicAndVidSubtitlesEncryptionInfo;

use Google\Cloud\Kms\V1\KeyManagementServiceClient;
use Google\Cloud\Core\Exception\ServiceException;
use Illuminate\Support\Facades\Log;
use Exception;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Redis;


class EncryptionAndDecryptionService
{
    private $kmsClient;
    private $projectId;
    private $locationId;
    private $keyRingId;


    public function __construct(KeyManagementServiceClient $kmsClient) {
        $this->kmsClient = $kmsClient;
        
        $this->projectId = "megagram_428802";
        $this->locationId = "global";
        $this->keyRingId = "cmksForBgMusicAndVidSubsOfPosts";
    }


    public function createNewCustomerMasterKey(string $keyAlias) {
        try {
            $keyName = $this->kmsClient->keyRingName(
                $this->projectId,
                $this->locationId,
                $this->keyRingId
            );

            $this->kmsClient->createCryptoKey($keyName, $keyAlias, [
                'purpose' => \Google\Cloud\Kms\V1\CryptoKey\CryptoKeyPurpose::ENCRYPT_DECRYPT
            ]);

            return true;
        }
        catch (ServiceException $e) {
            return false;
        }
    }


    public function deleteCustomerMasterKey(string $keyAlias) {
        try {
            $keyName = $this->kmsClient->cryptoKeyName(
                $this->projectId,
                $this->locationId,
                $this->keyRingId,
                $keyAlias
            );

            $this->kmsClient->destroyCryptoKeyVersion($keyName);
            return true;
        }
        catch (ServiceException $e) {
            return false;
        }
    }


    public function createAndEncryptNewDataEncryptionKey(string $keyAlias) {
        $plaintextDataEncryptionKey = random_bytes(32);

        $keyName = $this->kmsClient->cryptoKeyName(
            $this->projectId,
            $this->locationId,
            $this->keyRingId,
            $keyAlias
        );

        $encryptResponse = $this->kmsClient->encrypt($keyName, $plaintextDataEncryptionKey);

        $encryptedDataEncryptionKey = $encryptResponse->getCiphertext();
        return [$plaintextDataEncryptionKey, $encryptedDataEncryptionKey];
    }


    public function decryptEncryptedDataEncryptionKey($encryptedKey, string $keyAlias) {
        $keyName = $this->kmsClient->cryptoKeyName(
            $this->projectId,
            $this->locationId,
            $this->keyRingId,
            $keyAlias
        );

        $decryptResponse = $this->kmsClient->decrypt($keyName, $encryptedKey);
        return $decryptResponse->getPlaintext();
    }


    public function encryptDataWithDataEncryptionKey($plaintextData, $plaintextDataEncryptionKey) {
        $iv = random_bytes(12);
        $authTag = "";
        $ciphertext = openssl_encrypt(
            $plaintextData,
            'aes-256-gcm',
            $plaintextDataEncryptionKey,
            OPENSSL_RAW_DATA,
            $iv,
            $authTag
        );

        return [$ciphertext, $iv, $authTag];
    }


    public function decryptDataWithDataEncryptionKey(
        $encryptedBuffer, $plaintextDataEncryptionKey, $iv, $authTag
    ) {
        $decryptedData = openssl_decrypt(
            $encryptedBuffer,
            'aes-256-gcm',
            $plaintextDataEncryptionKey,
            OPENSSL_RAW_DATA,
            $iv,
            $authTag
        );

        return $decryptedData;
    }


    public function getPlaintextDataEncryptionKeyOfPost(string $overallPostId, $redisClient, $encryptionAndDecryptionService) {
        $encryptedDataEncryptionKey = null;
        $encryptedDataEncryptionKeyFromRedis = null;

        try {
            $encryptedDataEncryptionKeyFromRedis =  $redisClient->hGet(
                'Posts and their EncryptedDEKs for Bg-Music/Vid-Subs',
                $overallPostId
            );
        }
        catch (\Exception $e) {
            //pass
        }

        if ($encryptedDataEncryptionKeyFromRedis != null) {
            $encryptedDataEncryptionKey = $encryptedDataEncryptionKeyFromRedis;
        }
        else {
            $encryptedDataEncryptionKey = PostBgMusicAndVidSubtitlesEncryptionInfo
                ::where('overallPostId', $overallPostId)
                ->select('encryptedDataEncryptionKey')
                ->first();

            try {
                $redisClient->hSet(
                    'Posts and their EncryptedDEKs for Bg-Music/Vid-Subs',
                    $overallPostId,
                    $encryptedDataEncryptionKey
                );
            }
            catch (\Exception $e) {
                //pass
            }
        }

        $plaintextDataEncryptionKey = $encryptionAndDecryptionService->decryptEncryptedDataEncryptionKey(
            $encryptedDataEncryptionKey,
            "postBgMusicAndVidSubtitlesDEKCMK/{overallPostId}"
        );

        return $plaintextDataEncryptionKey;
    }

    public function getPlaintextDataEncryptionKeysOfMultiplePosts(string $overallPostIds, $redisClient,
    $encryptionAndDecryptionService) {
        $encryptedDataEncryptionKey = null;
        $encryptedDataEncryptionKeyFromRedis = null;

        $overallPostIdsAndTheirDataEncryptionKeys = [];

        try {
            $redisClient->multi(\Redis::PIPELINE);
            foreach ($overallPostIds as $overallPostId) {
                $redisClient->hGet(
                    'Posts and their EncryptedDEKs for Bg-Music/Vid-Subs',
                    $overallPostId
                );
            }
            $redisResults = $redisClient->exec();

            $newOverallPostIds = [];
            for ($i=0; $i<count($redisResults); $i++) {
                $redisResult = $redisResults[i];
                $overallPostId = $overallPostIds[i];

                if ($redisResult !== null) {
                    $overallPostIdsAndTheirDataEncryptionKeys[$overallPostId] = $redisResult;
                }
                else {
                    $newOverallPostIds[] = $overallPostId;
                }
            }

            $overallPostIds = $newOverallPostIds;
        }
        catch (\Exception $e) {
            //pass
        }

        if (count($overallPostIds) > 0) {
            $encryptedDEKs = PostBgMusicAndVidSubtitlesEncryptionInfo
                ::whereIn('overallPostId', $overallPostIds)
                ->toArray();

            foreach ($encryptedDEKs as $encryptedDEK) {
                $overallPostId = $encryptedDEK->$overallPostId;
                $encryptedDataEncryptionKey = $encryptedDEK->$encryptedDataEncryptionKey;

                $overallPostIdsAndTheirDataEncryptionKeys[$overallPostId] = $encryptedDataEncryptionKey;
            }

            try {
                $redisClient->multi(\Redis::PIPELINE);
                foreach ($overallPostIds as $overallPostId) {
                    $redisClient->hSet(
                        'Posts and their EncryptedDEKs for Bg-Music/Vid-Subs',
                        $overallPostId,
                        $overallPostIdsAndTheirDataEncryptionKeys[$overallPostId]
                    );
                }
                $redisResults = $redisClient->exec();
            }
            catch (\Exception $e) {
                //pass
            }
        }


        foreach ($overallPostIds as $overallPostId) {
            $overallPostIdsAndTheirDataEncryptionKeys[$overallPostId] =
            $encryptionAndDecryptionService->decryptEncryptedDataEncryptionKey(
                $overallPostIdsAndTheirDataEncryptionKeys[$overallPostId],
                "postBgMusicAndVidSubtitlesDEKCMK/{overallPostId}"
            );
        }

        return $overallPostIdsAndTheirDataEncryptionKeys;
    }
}
