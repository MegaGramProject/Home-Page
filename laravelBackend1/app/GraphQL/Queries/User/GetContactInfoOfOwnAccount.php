<?php

namespace App\GraphQL\Queries\User;

use App\Models\MySQL\User\PublicUser;
use App\Models\MySQL\User\PrivateUser;

use App\Services\EncryptionAndDecryptionService;
use App\Services\UserAuthService;

use Rebing\GraphQL\Support\Query;
use GraphQL\Type\Definition\Type;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;


class GetContactInfoOfOwnAccount extends Query {
    protected $redisClient;
    protected $userAuthService;
    protected $encryptionAndDecryptionService;

    protected $attributes = [
        'name' => 'GetContactInfoOfOwnAccount',
    ];


    public function __construct(UserAuthService $userAuthService, EncryptionAndDecryptionService $encryptionAndDecryptionService) {
        $this->redisClient = Redis::connection()->client();
        $this->userAuthService = $userAuthService;
        $this->encryptionAndDecryptionService = $encryptionAndDecryptionService;
    }
    

    public function type(): Type {
        return Type::string();
    }


    public function args(): array {
        return [
            'authUserId' => ['type' => Type::int()]
        ];
    }

    
    public function resolve($args, Request $request) {
        $authUserId = $args['authUserId'];

        if ($authUserId < 1) {
            abort(400, 'There does not exist a user with the provided authUserId.');
        }

        $userAuthenticationResult =  $this->userAuthService->authenticateUser(
            $authUserId, $request
        );

        if (is_bool($userAuthenticationResult)) {
            if (!$userAuthenticationResult) {
                abort(403, "The expressJSBackend1 server could not verify you as having the proper
                credentials to be logged in as $authUserId");
            }
        }
        else if (is_string($userAuthenticationResult)) {  
            if ($userAuthenticationResult === 'The provided authUser token, if any, in your cookies has an
            invalid structure.')  {  
                abort(403, $userAuthenticationResult);  
            }  
            abort(502, $userAuthenticationResult);  
        }

        $encryptedContactInfo = null;
        $contactInfoEncryptionIv = null;
        $contactInfoEncryptionAuthTag = null;
        $encryptedDataEncryptionKey = null;
        $contactInfoDataWasPresentInCache = false;
        
        try {
            $redisResult = $this->redisClient->hMGet(
                "dataForUser$authUserId",
                [
                    'encryptedContactInfo', 'contactInfoEncryptionIv', 'contactInfoEncryptionAuthTag',
                    'encryptedDataEncryptionKey'
                ]
            );
            
            if ($redisResult['encryptedContactInfo'] !== null && $redisResult['contactInfoEncryptionIv'] !== null &&
            $redisResult['contactInfoEncryptionAuthTag'] !== null && $redisResult['encryptedDataEncryptionKey'] !== null) {
                $encryptedContactInfo = $redisResult['encryptedContactInfo'];
                $contactInfoEncryptionIv = $redisResult['contactInfoEncryptionIv'];
                $contactInfoEncryptionAuthTag = $redisResult['contactInfoEncryptionAuthTag'];
                $encryptedDataEncryptionKey = $redisResult['encryptedDataEncryptionKey'];

                $contactInfoDataWasPresentInCache = true;
            }
        }
        catch (\Exception) {
            //pass
        }

        $userIsPrivate = false;

        if (!$contactInfoDataWasPresentInCache) {
            try {
                $nonRedisResult = PublicUser::where('id', $authUserId)
                    ->select(['encryptedContactInfo', 'contactInfoEncryptionIv', 'contactInfoEncryptionAuthTag',
                    'encryptedDataEncryptionKey'])
                    ->first();
                
                if ($nonRedisResult !== null) {
                    $nonRedisResult = $nonRedisResult->toArray();
    
                    $encryptedContactInfo = $nonRedisResult['encryptedContactInfo'];
                    $contactInfoEncryptionIv = $nonRedisResult['contactInfoEncryptionIv'];
                    $contactInfoEncryptionAuthTag = $nonRedisResult['contactInfoEncryptionAuthTag'];
                    $encryptedDataEncryptionKey = $nonRedisResult['encryptedDataEncryptionKey'];
                }
                else {
                    $nonRedisResult = PrivateUser::where('id', $authUserId)
                        ->select(['encryptedContactInfo', 'contactInfoEncryptionIv', 'contactInfoEncryptionAuthTag',
                        'encryptedDataEncryptionKey'])
                        ->first()
                        ->toArray();
                    
                    $userIsPrivate = true;
                    
                    $encryptedContactInfo = $nonRedisResult['encryptedContactInfo'];
                    $contactInfoEncryptionIv = $nonRedisResult['contactInfoEncryptionIv'];
                    $contactInfoEncryptionAuthTag = $nonRedisResult['contactInfoEncryptionAuthTag'];
                    $encryptedDataEncryptionKey = $nonRedisResult['encryptedDataEncryptionKey'];
                }
            }
            catch (\Exception) {
                abort(502, "There was trouble fetching the data of your encrypted contact-info");
            }
        }

        if (!$contactInfoDataWasPresentInCache) {
            try {
                $this->redisClient->hMSet(
                    "dataForUser$authUserId",
                    [
                        'encryptedContactInfo' => $encryptedContactInfo,
                        'contactInfoEncryptionIv' => $contactInfoEncryptionIv,
                        'contactInfoEncryptionAuthTag' => $contactInfoEncryptionAuthTag, 
    
                        'encryptedDataEncryptionKey' => $encryptedDataEncryptionKey,
                        'isPrivate' => $userIsPrivate == true ? 'true' : 'false'
                    ]
                );
            }
            catch (\Exception) {
                //pass
            }
        }

        $plaintextDataEncryptionKey  = null;
        try {
            $plaintextDataEncryptionKey = $this->encryptionAndDecryptionService->decryptEncryptedDataEncryptionKey(
                $encryptedDataEncryptionKey,
                'users',
                "user$authUserId",
            );
        }
        catch (\Exception) {
            abort(502, 'There was trouble decrypting the encrypted data-encryption-key to get the plaintext
            data-encryption key that is required to decrypt the contact-info you\'re looking for');
        }

        $decryptedContactInfo = $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
            $encryptedContactInfo, $plaintextDataEncryptionKey, $contactInfoEncryptionIv, $contactInfoEncryptionAuthTag
        );

        return $decryptedContactInfo;
    }
}
