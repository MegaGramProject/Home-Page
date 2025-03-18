<?php

namespace App\GraphQL\Queries\User;

use App\Models\MySQL\User\PublicUser;
use App\Models\MySQL\User\PrivateUser;

use App\Services\EncryptionAndDecryptionService;

use Rebing\GraphQL\Support\Query;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Redis;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Carbon\Carbon;


class GetInDepthInfoOnMultipleUsers extends Query {    
    protected $redisClient;
    protected $encryptionAndDecryptionService;

    protected $attributes = [
        'name' => 'GetInDepthInfoOnMultipleUsers',
    ];


    public function __construct(EncryptionAndDecryptionService $encryptionAndDecryptionService) {
        $this->redisClient = Redis::connection()->client();
        $this->encryptionAndDecryptionService = $encryptionAndDecryptionService;
    }


    public function type(): Type {
        return Type::listOf(GraphQL::type('inDepthUserInfo'));
    }


    public function args(): array {
        return [
            'userIds' => ['type' => Type::listOf(Type::int())],
        ];
    }

    
    public function resolve($args) {
        $userIds = $args['userIds'];
        $output = [];

        try {
            $redisResults = Redis::pipeline(function () use ($userIds) {
                foreach($userIds as $userId) {
                    $this->redisClient->hMGet(
                        "dataForUser$userId",
                        [
                            'username',
                            'fullName',
                            'isVerified',
                            'isPrivate',
                            'created',
                            
                            'dateOfBirth',
                            'accountBasedIn',
    
                            'encryptedDateOfBirth',
                            'encryptedAccountBasedIn',
    
                            'dateOfBirthEncryptionIv',
                            'accountBasedInEncryptionIv',
    
                            'dateOfBirthEncryptionAuthTag',
                            'accountBasedInEncryptionAuthTag',
    
                            'encryptedDataEncryptionKey'
                        ]
                    );
                }
            });

            $newUserIds = [];
            
            for ($i=0; $i<count($redisResults); $i++) {
                $redisResult = $redisResults[$i];
                $userId = $userIds[$i];

                $allFieldsHaveBeenFound = true;

                if ($redisResult['isPrivate'] !== null) {
                    if (!$redisResult['isPrivate']) {
                        $allFieldsHaveBeenFound = $redisResult['username'] !== null && $redisResult['fullName'] !== null &&
                        $redisResult['isVerified'] !== null && $redisResult['isPrivate'] !== null &&
                        $redisResult['created'] !== null && $redisResult['dateOfBirth'] !== null &&
                        $redisResult['accountBasedIn'] !== null;
                    }
                    else {
                        $allFieldsHaveBeenFound = $redisResult['username'] !== null && $redisResult['fullName'] !== null &&
                        $redisResult['isVerified'] !== null && $redisResult['isPrivate'] !== null &&
                        $redisResult['created'] !== null && $redisResult['encryptedDateOfBirth'] !== null &&
                        $redisResult['encryptedAccountBasedIn'] !== null && $redisResult['dateOfBirthEncryptionIv'] !== null &&
                        $redisResult['accountBasedInEncryptionIv'] !== null &&
                        $redisResult['dateOfBirthEncryptionAuthTag'] !== null &&
                        $redisResult['accountBasedInEncryptionAuthTag'] !== null &&
                        $redisResult['encryptedDataEncryptionKey'] !== null;
                    }
                }
                else {
                    $allFieldsHaveBeenFound = false;
                }

                if (!$allFieldsHaveBeenFound) {
                    $newUserIds[] = $userId;
                }
                else {
                    if (!$redisResult['isPrivate']) {
                        $output[] = [
                            'id' => $userId,
                            'username' => $redisResult['username'],
                            'fullName' => $redisResult['fullName'],
                            'isVerified' => $redisResult['isVerified'] === 'true' ? true : false,
                            'isPrivate' => false,
                            'created' => Carbon::parse($redisResult['created']),
                            'dateOfBirth' => Carbon::parse($redisResult['dateOfBirth']),
                            'accountBasedIn' => $redisResult['accountBasedIn'],
                        ];
                    }
                    else {
                        $plaintextDataEncryptionKey = null;

                        try {
                            $plaintextDataEncryptionKey = $this->encryptionAndDecryptionService->
                            decryptEncryptedDataEncryptionKey(
                                $redisResult['encryptedDataEncryptionKey'],
                                'users',
                                "user$userId"
                            );
                        }
                        catch (\Exception) {
                           //pass
                        }

                        if ($plaintextDataEncryptionKey !== null) {
                            $decryptedDateOfBirth = $this->encryptionAndDecryptionService->
                            decryptDataWithDataEncryptionKey(
                                $redisResult['encryptedDateOfBirth'],
                                $plaintextDataEncryptionKey,
                                $redisResult['dateOfBirthEncryptionIv'],
                                $redisResult['dateOfBirthEncryptionAuthTag'],
                            );
                            
                            $decryptedDateOfBirth = Carbon::parse($decryptedDateOfBirth);

                            $decryptedAccountBasedIn = $this->encryptionAndDecryptionService->
                            decryptDataWithDataEncryptionKey(
                                $redisResult['encryptedAccountBasedIn'],
                                $plaintextDataEncryptionKey,
                                $redisResult['accountBasedInEncryptionIv'],
                                $redisResult['accountBasedInEncryptionAuthTag'],
                            );

                            $output[] = [
                                'id' => $userId,
                                'username' => $redisResult['username'],
                                'fullName' => $redisResult['fullName'],
                                'isVerified' => $redisResult['isVerified'] === 'true' ? true : false,
                                'isPrivate' => true,
                                'created' => Carbon::parse($redisResult['created']),
                                'dateOfBirth' => $decryptedDateOfBirth,
                                'accountBasedIn' => $decryptedAccountBasedIn
                            ];
                        }
                    }
                }
            }

            if (count($newUserIds) == 0) {
                return $output;
            }
            $userIds = $newUserIds;
        }
        catch (\Exception) {
            //pass
        }

        $nonRedisResults = [];

        try {
            $nonRedisResults = PublicUser::whereIn('id', $userIds)
                ->select(['id', 'username', 'fullName', 'isVerified', 'created', 'dateOfBirth', 'accountBasedIn'])
                ->get()
                ->toArray();
            
            $userIdsThatArePublic = [];

            foreach($nonRedisResults as $nonRedisResult) {
                $output[] = [
                    'id' => $nonRedisResult['id'], 
                    'username' => $nonRedisResult['username'], 
                    'fullName' => $nonRedisResult['fullName'],
                    'isVerified' => $nonRedisResult['isVerified'],
                    'isPrivate' => false,
                    'created' => $nonRedisResult['created'],
                    'dateOfBirth' => $nonRedisResult['dateOfBirth'],
                    'accountBasedIn' => $nonRedisResult['accountBasedIn']
                ];

                $userIdsThatArePublic[$nonRedisResult['id']] = true;
            }

            $userIds = array_filter(
                $userIds,
                function ($userId) use ($userIdsThatArePublic) {
                    return !array_key_exists($userId, $userIdsThatArePublic);
                }
            );

            if (count($userIds) > 0) {
                $nonRedisResults = PrivateUser::whereIn('id', $userIds)
                    ->select(['id', 'username', 'fullName', 'isVerified', 'created', 'encryptedDateOfBirth',
                    'encryptedAccountBasedIn', 'dateOfBirthEncryptionIv', 'accountBasedInEncryptionIv',
                    'dateOfBirthEncryptionAuthTag', 'accountBasedInEncryptionAuthTag', 'encryptedDataEncryptionKey'])
                    ->get()
                    ->toArray();
                

                foreach($nonRedisResults as $nonRedisResult) {
                    $plaintextDataEncryptionKey = null;

                    try {
                        $plaintextDataEncryptionKey = $this->encryptionAndDecryptionService->
                        decryptEncryptedDataEncryptionKey(
                            $nonRedisResult['encryptedDataEncryptionKey'],
                            'users',
                            "user{$nonRedisResult['id']}"
                        );
                    }
                    catch (\Exception) {
                        //pass
                    }

                    if ($plaintextDataEncryptionKey !== null) {
                        $decryptedDateOfBirth = $this->encryptionAndDecryptionService->
                            decryptDataWithDataEncryptionKey(
                                $redisResult['encryptedDateOfBirth'],
                                $plaintextDataEncryptionKey,
                                $redisResult['dateOfBirthEncryptionIv'],
                                $redisResult['dateOfBirthEncryptionAuthTag'],
                            );
                        $decryptedDateOfBirth = Carbon::parse($decryptedDateOfBirth);

                        $decryptedAccountBasedIn = $this->encryptionAndDecryptionService->
                            decryptDataWithDataEncryptionKey(
                                $redisResult['encryptedAccountBasedIn'],
                                $plaintextDataEncryptionKey,
                                $redisResult['accountBasedInEncryptionIv'],
                                $redisResult['accountBasedInEncryptionAuthTag'],
                            );

                        $output[] = [
                            'id' => $nonRedisResult['id'], 
                            'username' => $nonRedisResult['username'], 
                            'fullName' => $nonRedisResult['fullName'],
                            'isVerified' => $nonRedisResult['isVerified'],
                            'isPrivate' => false,
                            'created' => $nonRedisResult['created'],
                            'dateOfBirth' => $decryptedDateOfBirth,
                            'accountBasedIn' => $decryptedAccountBasedIn
                        ];
                    }
                }
            }
        }
        catch (\Exception) {
            if (count($output) > 0) {
                return $output;
            }
            abort(502, "There was trouble fetching the in-depth-info of the list of userIds");
        }

        try {
            Redis::pipeline(function () use ($nonRedisResults, $userIdsThatArePublic) {
                foreach($nonRedisResults as $nonRedisResult) {
                    $userId = $nonRedisResult['id'];
                    if (array_key_exists($userId, $userIdsThatArePublic)) {
                        $this->redisClient->hMSet(
                            "dataForUser$userId",
                            [
                                'username' => $nonRedisResult['username'], 
                                'fullName' => $nonRedisResult['fullName'],
                                'isVerified' => $nonRedisResult['isVerified'] == true ? 'true' : 'false',
                                'isPrivate' => 'false',
                                'created' => $nonRedisResult['created']->toIso8601String(),
                                'dateOfBirth' => $nonRedisResult['dateOfBirth']->toIso8601String(),
                                'accountBasedIn' => $nonRedisResult['accountBasedIn'],
                            ]
                        );
                    }
                    else {
                        $this->redisClient->hMSet(
                            "dataForUser$userId",
                            [
                                'username' => $nonRedisResult['username'], 
                                'fullName' => $nonRedisResult['fullName'],
                                'isVerified' => $nonRedisResult['isVerified'] == true ? 'true' : 'false',
                                'isPrivate' => 'true',
                                'created' => $nonRedisResult['created']->toIso8601String(),
                                'encryptedDateOfBirth' => $nonRedisResult['encryptedDateOfBirth'],
                                'encryptedAccountBasedIn' => $nonRedisResult['encryptedAccountBasedIn'],
                                'dateOfBirthEncryptionIv' => $nonRedisResult['dateOfBirthEncryptionIv'],
                                'accountBasedInEncryptionIv' => $nonRedisResult['accountBasedInEncryptionIv'],
                                'dateOfBirthEncryptionAuthTag' => $nonRedisResult['dateOfBirthEncryptionAuthTag'],
                                'accountBasedInEncryptionAuthTag' => $nonRedisResult['accountBasedInEncryptionAuthTag'],
                                'encryptedDataEncryptionKey' => $nonRedisResult['encryptedDataEncryptionKey'],
                            ]
                        );
                    }
                }
            });
        }
        catch (\Exception) {
            //pass
        }

        return $output;
    }
}
