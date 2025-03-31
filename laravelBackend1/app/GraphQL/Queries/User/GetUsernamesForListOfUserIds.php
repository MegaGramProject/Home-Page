<?php

namespace App\GraphQL\Queries\User;

use App\Models\MySQL\User\PublicUser;
use App\Models\MySQL\User\PrivateUser;

use Rebing\GraphQL\Support\Query;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Redis;


class GetUsernamesForListOfUserIds extends Query {
    protected $redisClient;

    protected $attributes = [
        'name' => 'getUsernamesForListOfUserIds',
    ];


    public function __construct() {
        $this->redisClient = Redis::connection()->client();
    }

    
    public function type(): Type {
        return Type::listOf(Type::string());
    }


    public function args(): array {
        return [
            'userIds' => ['type' => Type::listOf(Type::int())],
        ];
    }

    
    public function resolve($args) {
        $userIds = $args['userIds'];
        $originalUserIds = $args['userIds'];
        $errorMessage = '';
        $output = [];

        try {
            $redisResults = $this->redisClient->pipeline(function ($pipe) use ($userIds) {
                foreach ($userIds as $userId) {
                    $pipe->hGet(
                        "dateForUser$userId",
                        "username"
                    );
                }
            });

            foreach ($redisResults as $redisResult) {
                $output[] = $redisResult;
            }

            return $output;
            
        }
        catch (\Exception) {
            $errorMessage .= '• There was trouble using the Redis-cache to get the usernames of
            each of the userIds in the provided list\n';
        }

        try {
            $userIdsAndTheirUsernames = [];

            $listOfPublicUserIdsAndTheirUsernames = PublicUser::whereIn('id', $userIds)
                ->select(['id', 'username'])
                ->get()
                ->toArray();

            foreach($listOfPublicUserIdsAndTheirUsernames as $publicUserIdAndTheirUsername) {
                $userId = $publicUserIdAndTheirUsername->id;
                $username = $publicUserIdAndTheirUsername->username;
                
                $userIdsAndTheirUsernames[$userId] = $username;
            }

            $userIds = array_filter($userIds, function ($userId) use ($userIdsAndTheirUsernames) {
                return !array_key_exists($userId, $userIdsAndTheirUsernames);
            });

            if (count($userIds) == 0) {
                foreach($originalUserIds as $originalUserId) {
                    $output[] = $userIdsAndTheirUsernames[$originalUserId] ?? null;
                }
                return $output;
            }

            $listOfPrivateUserIdsAndTheirUsernames = PrivateUser::whereIn('id', $userIds)
                ->select(['id', 'username'])
                ->get()
                ->toArray();
            
            foreach($listOfPrivateUserIdsAndTheirUsernames as $privateUserIdAndTheirUsername) {
                $userId = $privateUserIdAndTheirUsername->id;
                $username = $privateUserIdAndTheirUsername->username;
                
                $userIdsAndTheirUsernames[$userId] = $username;
            }

            foreach($originalUserIds as $originalUserId) {
                $output[] = $userIdsAndTheirUsernames[$originalUserId] ?? null;
            }
            return $output;
        }
        catch (\Exception) {
            $errorMessage .= '• There was trouble using the databases to get the usernames of 
            each of the public/private users in the provided list of userIds\n';
            abort(502, $errorMessage);
        }
    }
}
