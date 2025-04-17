<?php

namespace App\GraphQL\Queries\User;

use App\Models\MySQL\User\PublicUser;
use App\Models\MySQL\User\PrivateUser;
use App\Services\UserAuthService;

use Rebing\GraphQL\Support\Query;
use GraphQL\Type\Definition\Type;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Redis;


class GetUserIdOfUsername extends Query {
    protected $redisClient;
    protected $userAuthService;

    protected $attributes = [
        'name' => 'getUserIdOfUsername',
    ];


    public function __construct(UserAuthService $userAuthService) {
        $this->redisClient = Redis::connection()->client();
        $this->userAuthService = $userAuthService;
    }

    
    public function type(): Type {
        return Type::int();
    }


    public function args(): array {
        return [
            'authUserId' => ['type' => Type::int()],
            'username' => ['type' => Type::string()]
        ];
    }

    
    public function resolve($args, Request $request) {
        $authUserId = $args['authUserId'];
        $username = $args['username'];

        if ($authUserId < 1 && $authUserId !== -1) {
            abort(400, 'There does not exist a user with the provided authUserId. If you are just an anonymous guest,
            you must set the authUserId to -1.');
        }

        if ((strlen($username) < 1 || strlen($username) > 30) || (!preg_match('/^[a-z0-9._]{1,30}$/', $username))) {
            abort(400, 'The provided username is invalid');
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

        $userId = null;
        
        try {
            $userId = $this->redisClient->get("userIdOfUser{$username}");

            if ($userId == null) {
                return null;
            }

        }
        catch (\Exception) {
            //pass
        }

        if ($userId == null) {
            try {
                $userId = PublicUser::where('username', $username)->value('id');
                
                if ($userId == null) {
                    $userId = PrivateUser::where('username', $username)->value('id');

                    if($userId == null) {
                        return null;
                    }
                }
            }
            catch (\Exception) {
                abort(502, 'There was trouble fetching the asked-for data from the database');
            }
        }

        if (!$authUserIsAnonymousGuest) {
            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->get(
                    "http://34.111.89.101/api/Home-Page/djangoBackend2/checkIfUserIsInBlockingsOfAuthUser/$authUserId/$userId"
                );
    
                if ($response->failed()) {
                    abort(
                        502,
                        'The djangoBackend2 server had trouble checking whether or not the user is in your blockings'
                    );
                }
    
                $stringifiedResponseData = $response->body();
                $userIsInBlockingsOfAuthUser = json_decode($stringifiedResponseData);    

                if ($userIsInBlockingsOfAuthUser) {
                    return null;
                }
            }
            catch (\Exception) {
                abort(
                    502,
                    'There was trouble connecting to the djangoBackend2 server to check whether or not the user is in
                    your blockings'
                );
            }
        }
        
        return $userId;
    }
}
