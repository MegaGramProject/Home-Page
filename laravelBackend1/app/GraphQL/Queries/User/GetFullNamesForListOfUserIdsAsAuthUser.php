<?php

namespace App\GraphQL\Queries\User;

use App\Models\MySQL\User\PublicUser;
use App\Models\MySQL\User\PrivateUser;

use App\Services\UserAuthService;

use Illuminate\Http\Request;
use Rebing\GraphQL\Support\Query;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Http;


class GetFullNamesForListOfUserIdsAsAuthUser extends Query {
    protected $redisClient;
    protected $userAuthService;

    protected $attributes = [
        'name' => 'getFullNamesForListOfUserIdsAsAuthUser',
    ];


    public function __construct(UserAuthService $userAuthService) {
        $this->redisClient = Redis::connection()->client();
        $this->userAuthService = $userAuthService;
    }


    public function type(): Type {
        return Type::listOf(Type::string());
    }


    public function args(): array {
        return [
            'authUserId' => ['type' => Type::int()],
            'userIds' => ['type' => Type::listOf(Type::int())]
        ];
    }

    
    public function resolve($args, Request $request) {
        $authUserId = $args['authUserId'];
        $userIds = $args['userIds'];
        $originalUserIds = $userIds;

        if ($authUserId < 1 && $authUserId !== -1) {
            abort(400, 'There does not exist a user with the provided authUserId. If you are just an anonymous guest,
            you must set the authUserId to -1.');
        }

        $userIds = array_filter($userIds, function($userId) {
            return $userId > 0;
        });
        
        if (count($userIds) == 0) {
            abort(400, 'You did not provide a valid list of userIds for the \'userIds\' parameter of this graphql-query.');
        }

        $authUserIsAnonymousGuest = $authUserId == -1;

        if (!$authUserIsAnonymousGuest) {
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
            else {  
                $refreshedAuthToken = $userAuthenticationResult[0];  
                $expirationDate = $userAuthenticationResult[1];  

                setcookie(
                    "authToken$authUserId",
                    $refreshedAuthToken,
                    $expirationDate,
                    '/',
                    '',
                    true,
                    true
                );
            }  
        }

        $usersAndIfTheyAreInBlockingsOfAuthUser = [];

        if (!$authUserIsAnonymousGuest) {
            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->post(
                    "http://34.111.89.101/api/Home-Page/djangoBackend2/checkIfUsersInListAreInBlockingsOfAuthUser/$authUserId",
                    [
                        'userIds' => $userIds
                    ]
                );
    
                if ($response->failed()) {
                    abort(
                        502,
                        'The djangoBackend2 server had trouble checking whether or not any of the users in the list are in your
                        blockings'
                    );
                }
    
                $stringifiedResponseData = $response->body();
                $usersAndIfTheyAreInBlockingsOfAuthUser = json_decode($stringifiedResponseData, true);            
            }
            catch (\Exception) {
                abort(
                    502,
                    'There was trouble connecting to the djangoBackend2 server to check whether or not any of the users in the
                    list are in your blockings'
                );
            }
        }

        $userIds = array_filter($userIds, function($userId) use ($usersAndIfTheyAreInBlockingsOfAuthUser) {
            return !$usersAndIfTheyAreInBlockingsOfAuthUser[$userId];
        });

        $output = [];

        if (count($userIds) == 0) {
            foreach($originalUserIds as $_) {
                $output[] = null;
            }

            return null;
        }

        $usersAndTheirFullNames = [];

        try {
            $redisResults = $this->redisClient->pipeline(function ($pipe) use ($userIds) {
                foreach($userIds as $userId) {
                    $pipe->hGet(
                        "dataForUser$userId",
                        'fullName'
                    );
                }
            });

            for ($i=0; $i<count($redisResults); $i++) {
                $userId = $userIds[$i];
                $fullName = $redisResults[$i];
                $usersAndTheirFullNames[$userId] = $fullName;
            }

            foreach($originalUserIds as $originalUserId) {
                $output[] =  $usersAndTheirFullNames[$originalUserId] ?? null;
            }

            return $output;
        }
        catch (\Exception) {}
        
        try {
            $publicUsersAndTheirFullNames = PublicUser::whereIn('id', $userIds)
                ->pluck('fullName', 'id')
                ->toArray();
            
            foreach (array_keys($publicUsersAndTheirFullNames) as $publicUserId) {
                $usersAndTheirFullNames[$publicUserId] = $publicUsersAndTheirFullNames[$publicUserId];
            }

            $privateUserIds = array_filter($userIds, function($userId) use ($usersAndTheirFullNames) {
                return !array_key_exists($usersAndTheirFullNames, $userId);
            });

            if (count($privateUserIds) > 0) {
                $privateUsersAndTheirFullNames = PrivateUser::whereIn('id', $privateUserIds)
                    ->pluck('fullName', 'id')
                    ->toArray();
            
                foreach (array_keys($privateUsersAndTheirFullNames) as $privateUserId) {
                    $usersAndTheirFullNames[$privateUserId] = $privateUsersAndTheirFullNames[$privateUserId];
                }
            }
            
            foreach($originalUserIds as $originalUserId) {
                $output[] =  $usersAndTheirFullNames[$originalUserId] ?? null;
            }

            return $output;
        }
        catch (\Exception) {
            abort(
                502,
                'There was trouble fetching the asked-for data from the database'
            );
        }
    }
}
