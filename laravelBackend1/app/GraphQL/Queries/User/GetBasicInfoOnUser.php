<?php

namespace App\GraphQL\Queries\User;

use App\Models\MySQL\User\PublicUser;
use App\Models\MySQL\User\PrivateUser;
use App\Services\UserAuthService;

use Rebing\GraphQL\Support\Query;
use GraphQL\Type\Definition\Type;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Http;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Carbon\Carbon;


class GetBasicInfoOnUser extends Query {
    protected $redisClient;
    protected $userAuthService;

    protected $attributes = [
        'name' => 'GetBasicInfoOnUser',
    ];


    public function __construct(UserAuthService $userAuthService) {
        $this->redisClient = Redis::connection()->client();
        $this->userAuthService = $userAuthService;
    }

    
    public function type(): Type {
        return GraphQL::type('basicUserInfo');
    }


    public function args(): array {
        return [
            'authUserId' => ['type' => Type::int()],
            'id' => ['type' => Type::int()],
        ];
    }

    
    public function resolve($args, Request $request) {
        $authUserId = $args['authUserId'];
        $id = $args['id'];

        if ($authUserId < 1 && $authUserId !== -1) {
            abort(400, 'There does not exist a user with the provided authUserId. If you are just an anonymous guest,
            you must set the authUserId to -1.');
        }

        if ($id < 1) {
            abort(400, 'There does not exist a user with the provided id.');
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

        if (!$authUserIsAnonymousGuest) {
            try {
                $response = Http::get(
                    "http://34.111.89.101/api/Home-Page/djangoBackend2/checkIfUserIsInBlockingsOfAuthUser/$authUserId/$id"
                );
    
                
                if ($response->failed()) {
                    abort(502, "The djangoBackend2 server had trouble checking whether or not user $id is in your blockings");
                }
    
                $stringifiedResponseData = $response->body();
                $userIsInBlockingsOfAuthUser = json_decode($stringifiedResponseData);
                
                if ($userIsInBlockingsOfAuthUser) {
                    abort(404, "There user $id does not exist");
                }
            }
            catch (\Exception) {
                abort(
                    502,
                    "There was trouble connecting to the djangoBackend2 server to check whether or not user $id is in your
                    blockings",
                );
            }
        }

        try {
            $redisResults = $this->redisClient->hMGet(
                "dataForUser$id",
                ['username', 'fullName', 'isVerified', 'isPrivate', 'created']
            );
            
            $allFieldsWereFound = true;
            foreach(array_keys($redisResults) as $basicUserInfoField) {
                if ($redisResults[$basicUserInfoField] == null) {
                    $allFieldsWereFound = false;
                    break;
                }
            }

            if ($allFieldsWereFound) {
                $redisResults['isVerified'] = $redisResults['isVerified'] === 'true' ? true : false;
                $redisResults['isPrivate'] = $redisResults['isPrivate'] === 'true' ? true : false;
                $redisResults['created'] = Carbon::parse($redisResults['created']);
                return $redisResults;
            }
        }
        catch (\Exception) {
            //pass
        }

        $basicUserInfo = null;

        try {
            $basicUserInfo = PublicUser::where('id', $id)
                ->select(['username', 'fullName', 'isVerified', 'created'])
                ->first();
            
            if ($basicUserInfo !== null) {
                $basicUserInfo = $basicUserInfo->toArray();
                $basicUserInfo['isPrivate'] = false;
            }
            else {
                $basicUserInfo = PrivateUser::where('id', $id)
                    ->select(['username', 'fullName', 'isVerified', 'created'])
                    ->first();
                
                if ($basicUserInfo !== null) {
                    $basicUserInfo = $basicUserInfo->toArray();
                    $basicUserInfo['isPrivate'] = true;
                }
                else {
                    abort(404, "There user $id does not exist");
                }
            }
        }
        catch (\Exception) {
            abort(502, "There was trouble fetching the basic user-info of user $id");
        }

        try {
            $this->redisClient->hMSet(
                "dataForUser$id",
                [
                    'username' => $basicUserInfo['username'], 
                    'fullName' => $basicUserInfo['fullName'],
                    'created' => $basicUserInfo['created']->toIso8601String(),
                    'isVerified' => $basicUserInfo['isVerified'] == true ? 'true' : 'false',
                    'isPrivate' => $basicUserInfo['isPrivate'] == true ? 'true' : 'false'
                ]
            );
        }
        catch (\Exception) {
            //pass
        }

        return Response::json(
            $basicUserInfo
        );
    }
}
