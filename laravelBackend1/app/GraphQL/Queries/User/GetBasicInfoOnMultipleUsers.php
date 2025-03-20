<?php

namespace App\GraphQL\Queries\User;

use App\Models\MySQL\User\PublicUser;
use App\Models\MySQL\User\PrivateUser;

use Rebing\GraphQL\Support\Query;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Redis;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Carbon\Carbon;


class GetBasicInfoOnMultipleUsers extends Query {
    protected $redisClient;

    protected $attributes = [
        'name' => 'getBasicInfoOnMultipleUsers',
    ];


    public function __construct() {
        $this->redisClient = Redis::connection()->client();
    }


    public function type(): Type {
        return Type::listOf(GraphQL::type('basicUserInfo'));
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
            $redisResults = $this->redisClient->pipeline(function ($pipe) use ($userIds) {
                foreach($userIds as $userId) {
                    $pipe->hMGet(
                        "dataForUser$userId",
                        ['username', 'fullName', 'isVerified', 'isPrivate', 'created']
                    );
                }
            });

            $newUserIds = [];
            
            for ($i=0; $i<count($redisResults); $i++) {
                $redisResult = $redisResults[$i];
                $allFieldsHaveBeenFound = true;
                foreach(array_keys($redisResult) as $basicUserInfoField) {
                    if ($redisResult[$basicUserInfoField] == null) {
                        $allFieldsHaveBeenFound = false;
                        break;
                    }
                }

                if (!$allFieldsHaveBeenFound) {
                    $newUserIds[] = $userIds[$i];
                }
                else {
                    $output[] = [
                        'id' => $userIds[$i],
                        'username' => $redisResult['username'], 
                        'fullName' => $redisResult['fullName'],
                        'created' => Carbon::parse($redisResult['created']),
                        'isVerified' => $redisResult['isVerified'] === 'true' ? true : false,
                        'isPrivate' => $redisResult['isPrivate'] === 'true' ? true : false
                    ];
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

        $basicUserInfoOfMultipleUsers = [];

        try {
            $basicUserInfoOfMultipleUsers = PublicUser::whereIn('id', $userIds)
                ->select(['id', 'username', 'fullName', 'isVerified', 'created'])
                ->get()
                ->toArray();
            
            $userIdsThatArePublic = [];

            foreach($basicUserInfoOfMultipleUsers as $basicUserInfo) {
                $output[] = [
                    'id' => $basicUserInfo['id'], 
                    'username' => $basicUserInfo['username'], 
                    'fullName' => $basicUserInfo['fullName'],
                    'created' => $basicUserInfo['created'],
                    'isVerified' => $basicUserInfo['isVerified'],
                    'isPrivate' => false
                ];

                $userIdsThatArePublic[$basicUserInfo['id']] = true;
            }

            $userIds = array_filter(
                $userIds,
                function ($userId) use ($userIdsThatArePublic) {
                    return !array_key_exists($userId, $userIdsThatArePublic);
                }
            );

            if (count($userIds) > 0) {
                $basicUserInfoOfMultipleUsers = PrivateUser::whereIn('id', $userIds)
                    ->select(['id', 'username', 'fullName', 'isVerified', 'created'])
                    ->get()
                    ->toArray();
                

                foreach($basicUserInfoOfMultipleUsers as $basicUserInfo) {
                    $output[] = [
                        'id' => $basicUserInfo['id'], 
                        'username' => $basicUserInfo['username'], 
                        'fullName' => $basicUserInfo['fullName'],
                        'created' => $basicUserInfo['created'],
                        'isVerified' => $basicUserInfo['isVerified'],
                        'isPrivate' => true
                    ];
                }
            }
        }
        catch (\Exception) {
            if (count($output) > 0) {
                return $output;
            }
            abort(502, "There was trouble fetching the basic-info of the list of userIds");
        }

        try {
            $redisResults = $this->redisClient->pipeline(function ($pipe) use ($basicUserInfoOfMultipleUsers) {
                foreach($basicUserInfoOfMultipleUsers as $basicUserInfo) {
                    $userId = $basicUserInfo['id'];
                    $pipe->hMSet(
                        "dataForUser$userId",
                        [
                            'id' => $basicUserInfo['id'], 
                            'username' => $basicUserInfo['username'], 
                            'fullName' => $basicUserInfo['fullName'],
                            'created' => $basicUserInfo['created']->toIso8601String(),
                            'isVerified' => $basicUserInfo['isVerified'] == true ? 'true' : 'false',
                            'isPrivate' => $basicUserInfo['isPrivate'] == true ? 'true' : 'false'
                        ]
                    );
                }
            });
        }
        catch (\Exception) {
            //pass
        }

        return $output;
    }
}
