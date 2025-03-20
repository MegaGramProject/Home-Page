<?php

namespace App\Services;

use App\Models\Oracle\PostBgMusicAndVidSubtitlesEncryptionInfo;

use Google\Cloud\Kms\V1\KeyManagementServiceClient;
use Google\Cloud\Core\Exception\ServiceException;
use Exception;
use Illuminate\Support\Facades\Redis;


class EncryptionAndDecryptionService {
    protected $kmsClient;
    protected $projectId;
    protected $locationId;


    public function __construct(KeyManagementServiceClient $kmsClient) {
        $this->kmsClient = $kmsClient;
        
        $this->projectId = "megagram_428802";
        $this->locationId = "global";
    }


    public function createNewCustomerMasterKey(string $keyRingId, string $keyAlias) {
        try {
            $keyName = $this->kmsClient->keyRingName(
                $this->projectId,
                $this->locationId,
                $keyRingId
            );

            $this->kmsClient->createCryptoKey($keyName, $keyAlias, [
                'purpose' => \Google\Cloud\Kms\V1\CryptoKey\CryptoKeyPurpose::ENCRYPT_DECRYPT
            ]);

            return true;
        }
        catch (ServiceException) {
            return false;
        }
    }


    public function deleteCustomerMasterKey(string $keyRingId, string $keyAlias) {
        try {
            $keyName = $this->kmsClient->cryptoKeyName(
                $this->projectId,
                $this->locationId,
                $keyRingId,
                $keyAlias
            );

            $this->kmsClient->destroyCryptoKeyVersion($keyName);
            return true;
        }
        catch (ServiceException) {
            return false;
        }
    }


    public function createAndEncryptNewDataEncryptionKey(string $keyRingId, string $keyAlias) {
        $plaintextDataEncryptionKey = random_bytes(32);

        $keyName = $this->kmsClient->cryptoKeyName(
            $this->projectId,
            $this->locationId,
            $keyRingId,
            $keyAlias
        );

        $encryptResponse = $this->kmsClient->encrypt($keyName, $plaintextDataEncryptionKey);

        $encryptedDataEncryptionKey = $encryptResponse->getCiphertext();
        return [$plaintextDataEncryptionKey, $encryptedDataEncryptionKey];
    }


    public function decryptEncryptedDataEncryptionKey($encryptedKey, string $keyRingId, string $keyAlias) {
        $keyName = $this->kmsClient->cryptoKeyName(
            $this->projectId,
            $this->locationId,
            $keyRingId,
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


    public function decryptDataWithDataEncryptionKey($encryptedBuffer, $plaintextDataEncryptionKey, $iv, $authTag) {
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
        catch (\Exception) {
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
            catch (\Exception) {
                //pass
            }
        }

        $plaintextDataEncryptionKey = $encryptionAndDecryptionService->decryptEncryptedDataEncryptionKey(
            $encryptedDataEncryptionKey,
            "bgMusicAndVidSubsOfPosts",
            "post$overallPostId",
        );

        return $plaintextDataEncryptionKey;
    }

    public function getPlaintextDataEncryptionKeysOfMultiplePosts($overallPostIds, $redisClient,
    $encryptionAndDecryptionService) {
        $encryptedDataEncryptionKey = null;
        $encryptedDataEncryptionKeyFromRedis = null;

        $overallPostIdsAndTheirDataEncryptionKeys = [];

        try {
            $redisResults = $redisClient->pipeline(function ($pipe) use ($overallPostIds) {
                foreach ($overallPostIds as $overallPostId) {
                    $pipe->hGet(
                        'Posts and their EncryptedDEKs for Bg-Music/Vid-Subs',
                        $overallPostId
                    );
                }
            });

            $newOverallPostIds = [];
            for ($i=0; $i<count($redisResults); $i++) {
                $redisResult = $redisResults[$i];
                $overallPostId = $overallPostIds[$i];

                if ($redisResult !== null) {
                    $overallPostIdsAndTheirDataEncryptionKeys[$overallPostId] = $redisResult;
                }
                else {
                    $newOverallPostIds[] = $overallPostId;
                }
            }

            $overallPostIds = $newOverallPostIds;
        }
        catch (\Exception) {
            //pass
        }

        if (count($overallPostIds) > 0) {
            $encryptedDEKs = PostBgMusicAndVidSubtitlesEncryptionInfo
                ::whereIn('overallPostId', $overallPostIds)
                ->get()
                ->toArray();

            foreach ($encryptedDEKs as $encryptedDEK) {
                $overallPostId = $encryptedDEK->$overallPostId;
                $encryptedDataEncryptionKey = $encryptedDEK->$encryptedDataEncryptionKey;

                $overallPostIdsAndTheirDataEncryptionKeys[$overallPostId] = $encryptedDataEncryptionKey;
            }

            try {
                $redisResults = $redisClient->pipeline(function ($pipe) use ($overallPostIds,
                $overallPostIdsAndTheirDataEncryptionKeys) {
                    foreach ($overallPostIds as $overallPostId) {
                        $pipe->hSet(
                            'Posts and their EncryptedDEKs for Bg-Music/Vid-Subs',
                            $overallPostId,
                            $overallPostIdsAndTheirDataEncryptionKeys[$overallPostId]
                        );
                    }
                });
            }
            catch (\Exception) {
                //pass
            }
        }


        foreach ($overallPostIds as $overallPostId) {
            $overallPostIdsAndTheirDataEncryptionKeys[$overallPostId] =
            $encryptionAndDecryptionService->decryptEncryptedDataEncryptionKey(
                $overallPostIdsAndTheirDataEncryptionKeys[$overallPostId],
                "bgMusicAndVidSubsOfPosts",
                "post$overallPostId"
            );
        }

        return $overallPostIdsAndTheirDataEncryptionKeys;
    }
}
