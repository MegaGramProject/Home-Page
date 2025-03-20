<?php

namespace App\GraphQL\Queries\User;

use App\Models\MySQL\User\PublicUser;
use App\Models\MySQL\User\PrivateUser;

use Rebing\GraphQL\Support\Query;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Http;

class GetIsPrivateStatusesOfList extends Query {
    protected $redisClient;

    protected $attributes = [
        'name' => 'getIsPrivateStatusesOfList',
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
        $originalUserIds = $userIds;

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

        $userIdsAndTheirOutputs = [];
        foreach($originalUserIds as $originalUserId) {
            $userIdsAndTheirOutputs[$originalUserId] = -1;
        }

        $newUserIds =  array_filter($userIds, function ($userId) use ($userIdsAndIfTheyAreInAuthUserBlockings) {
            return !array_key_exists($userId, $userIdsAndIfTheyAreInAuthUserBlockings);
        });

        $output = [];

        if (count($newUserIds) == 0) {
            foreach($originalUserIds as $originalUserId) {
                $output[] = $userIdsAndTheirOutputs[$originalUserId];
            }
            return $output;
        }
        $userIds = $newUserIds;

        try {
            $redisResults = $this->redisClient->pipeline(function ($pipe) use ($userIds) {
                foreach ($userIds as $userId) {
                    $pipe->hGet(
                        "dateForUser$userId",
                        "isPrivate"
                    );
                }
            });

            $newUserIds = [];

            for ($i=0; $i<count($redisResults); $i++) {
                $redisResult = $redisResults[$i];
                $userId = $userIds[$i];

                if ($redisResult !== null) {
                    if ($redisResult === 'true') {
                        $userIdsAndTheirOutputs[$userId] = 1;
                    }
                    else {
                        $userIdsAndTheirOutputs[$userId] = 0;
                    }
                }
                else {
                    $newUserIds[] = $userId;
                }
            }

            if (count($newUserIds) == 0) {
                foreach($originalUserIds as $originalUserId) {
                    $output[] = $userIdsAndTheirOutputs[$originalUserId];
                }
                return $output;
            }

            $userIds = $newUserIds;
        }
        catch (\Exception) {
            $errorMessage .= '• There was trouble using the Redis-cache to get the account-visibility-statuses of the userIds
            in the provided list\n';
        }

        try {
            $publicUserIdsInList = PublicUser::whereIn('id', $userIds)
                ->pluck('id')
                ->toArray();


            $userIdsAndIfTheyArePublic = [];
            foreach($publicUserIdsInList as $publicUserId) {
                $userIdsAndTheirOutputs[$publicUserId] = 0;
                $userIdsAndIfTheyArePublic[$publicUserId] = true;
            }

            $userIds = array_filter($userIds, function ($userId) use ($userIdsAndIfTheyArePublic) {
                return !array_key_exists($userId, $userIdsAndIfTheyArePublic);
            });

            if (count($userIds) == 0) {
                foreach($originalUserIds as $originalUserId) {
                    $output[] = $userIdsAndTheirOutputs[$originalUserId];
                }
                return $output;
            }

            $privateUserIdsInList = PrivateUser::whereIn('id', $userIds)
                ->pluck('id')
                ->toArray();
            
            foreach($privateUserIdsInList as $privateUserId) {
                $userIdsAndTheirOutputs[$privateUserId] = 1;
            }

            foreach($originalUserIds as $originalUserId) {
                $output[] = $userIdsAndTheirOutputs[$originalUserId];
            }
            return $output;
        }
        catch (\Exception) {
            $errorMessage .= '• There was trouble using the databases to get account-visibility-statuses of the userIds
            in the provided list\n';
            abort(502, $errorMessage);
        }
    }
}
