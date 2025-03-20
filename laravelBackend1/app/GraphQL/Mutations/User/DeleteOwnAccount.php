<?php

namespace App\GraphQL\Mutations\User;

use App\Models\MySQL\User\PublicUser;
use App\Models\MySQL\User\PrivateUser;

use App\Services\UserAuthService;

use Rebing\GraphQL\Support\Mutation;
use GraphQL\Type\Definition\Type;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Redis;


class DeleteOwnAccount extends Mutation {
    protected $redisClient;
    protected $userAuthService;

    protected $attributes = [
        'name' => 'deleteOwnAccount',
    ];


    public function __construct(UserAuthService $userAuthService) {
        $this->redisClient = Redis::connection()->client();
        $this->userAuthService = $userAuthService;
    }


    public function middleware(array $middleware) {
        return array_merge($middleware, ['throttle:graphql_rate-limit-3-per-min']);
    }


    public function type(): Type {
        return Type::boolean();
    }

    
    public function args(): array {
        return [
            'authUserId' => [
                'type' => Type::int(),
            ],
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

        try {
            $numDeleted = PublicUser::where('id', $authUserId) ->delete();
            if ($numDeleted !== 1) {
                PrivateUser::where('id', $authUserId) ->delete();
            }
        }
        catch (\Exception) {
            abort(502, 'There was trouble deleting your account');
        }

        try {
            $this->encryptionAndDecryptionService->deleteCustomerMasterKey(
                'users',
                "user$authUserId"
            );
        }
        catch (\Exception) {
            abort(502, 'There was trouble deleting the GCP customer-master-key used for encrypting and decrypting
            the data-encryption-key of sensitive info of your account.');
        }

        try {
            $this->redisClient->del("dataForUser$authUserId");
        }
        catch (\Exception) {
            abort(502, 'There was trouble deleting the caching of the data of your account.');
        }

        return Response::json(
            true
        );
    }
}