<?php

namespace App\GraphQL\Queries\User;

use App\Models\MySQL\User\PublicUser;
use App\Models\MySQL\User\PrivateUser;

use Rebing\GraphQL\Support\Query;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Http;

class GetTheUserIdsThatExistInList extends Query {
    protected $redisClient;

    protected $attributes = [
        'name' => 'getTheUserIdsThatExistInList',
    ];


    public function __construct() {
        $this->redisClient = Redis::connection()->client();
    }

    
    public function type(): Type {
        return Type::listOf(Type::int());
    }


    public function args(): array {
        return [
            'authUserId' => ['type' => Type::int()],
            'userIds' => ['type' => Type::listOf(Type::int())],
        ];
    }

    
    public function resolve($args) {
        $authUserId = $args['authUserId'];
        $userIds = $args['userIds'];

        $userIdsAndIfTheyAreInAuthUserBlockings = [];
        $errorMessage = '';

        try {
            $response = Http::get(
                "http://34.111.89.101/api/Home-Page/djangoBackend2/getBlockingsOfUser/$authUserId"
            );

            
            if ($response->failed()) {
                $errorMessage .= "• The djangoBackend2 server had trouble getting the blockings of $authUserId\n";
                abort(502, $errorMessage);
            }

            $stringifiedResponseData = $response->body();
            $authUserBlockings = json_decode($stringifiedResponseData);

            foreach($authUserBlockings as $userIdOfAuthUserBlocking) {
                $userIdsAndIfTheyAreInAuthUserBlockings[$userIdOfAuthUserBlocking] = true;
            }
        }
        catch (\Exception) {
            $errorMessage .=  "• There was trouble connecting to the djangoBackend2 server to get the blockings of
            $authUserId\n";
            abort(502, $errorMessage);
        }

        $userIdsThatExist = [];
        $userIds =  array_filter($userIds, function ($userId) use ($userIdsAndIfTheyAreInAuthUserBlockings) {
            return !array_key_exists($userId, $userIdsAndIfTheyAreInAuthUserBlockings);
        });

        if (count($userIds) == 0) {
            return $userIdsThatExist;
        }

        try {
            $redisResults = $this->redisClient->pipeline(function ($pipe) use ($userIds) {
                foreach ($userIds as $userId) {
                    $pipe->exists($userId);
                }
            });

            for ($i=0; $i<count($redisResults); $i++) {
                $redisResult = $redisResults[$i];
                $userId = $userIds[$i];

                if ($redisResult == 1) {
                    $userIdsThatExist[] = $userId;
                }
            }
            return $userIdsThatExist; 
        }
        catch (\Exception) {
            $errorMessage .= '• There was trouble using the Redis-cache to get the userIds that exist\n';
        }

        try {
            $userIdsThatExist = PublicUser::whereIn('id', $userIds)
                ->pluck('id')
                ->toArray();

            $userIdsAndIfTheyArePublic = [];
            foreach($userIdsThatExist as $userId) {
                $userIdsAndIfTheyArePublic[$userId] = true;
            }

            $userIds = array_filter($userIds, function ($userId) use ($userIdsAndIfTheyArePublic) {
                return !array_key_exists($userId, $userIdsAndIfTheyArePublic);
            });

            if (count($userIds) == 0) {
                return $userIdsThatExist;
            }

            $privateUserIdsThatExist = PrivateUser::whereIn('id', $userIds)
                ->pluck('id')
                ->toArray();
            
            $userIdsThatExist = [...$userIdsThatExist, ...$privateUserIdsThatExist];
            
            return $userIdsThatExist;  
        }
        catch (\Exception) {
            $errorMessage .= '• There was trouble using the databases to get the userIds that exist\n';
            abort(502, $errorMessage);
        }
    }
}
