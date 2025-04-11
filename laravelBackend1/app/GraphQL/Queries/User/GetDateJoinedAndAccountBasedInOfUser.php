<?php

namespace App\GraphQL\Queries\User;

use App\Models\MySQL\User\PublicUser;
use App\Models\MySQL\User\PrivateUser;
use App\Services\UserAuthService;

use Rebing\GraphQL\Support\Query;
use GraphQL\Type\Definition\Type;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Http;


class GetDateJoinedAndAccountBasedInOfUser extends Query {
    protected $redisClient;
    protected $userAuthService;

    protected $attributes = [
        'name' => 'getDateJoinedAndAccountBasedInOfUser',
    ];


    public function __construct(UserAuthService $userAuthService) {
        $this->redisClient = Redis::connection()->client();
        $this->userAuthService = $userAuthService;
    }


    public function middleware(array $middleware) {
        return array_merge($middleware, ['throttle:graphql_rate-limit-10-per-min']);
    }

    
    public function type(): Type {
        return Type::listOf(Type::string());
    }


    public function args(): array {
        return [
            'authUserId' => ['type' => Type::int()],
            'userId' => ['type' => Type::int()],
        ];
    }

    
    public function resolve($args, Request $request) {
        $authUserId = $args['authUserId'];
        $userId = $args['userId'];

        if ($authUserId < 1 && $authUserId !== -1) {
            abort(400, 'There does not exist a user with the provided authUserId. If you are just an anonymous guest,
            you must set the authUserId to -1.');
        }

        if ($userId < 1) {
            abort(400, 'There does not exist a user with the provided userId.');
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

        $userIsPrivate = null;
        $encryptedDataEncryptionKey = null;

        try {
            $redisResult = $this->redisClient->hGet(
                "dataForUser$userId",
                ['isPrivate', 'encryptedDataEncryptionKey']
            );

            if ($redisResult['isPrivate'] == null) {
                abort(404, "The user $userId does not exist");
            }

            $userIsPrivate = $redisResult['isPrivate'] === 'true' ? true : false;
            if ($userIsPrivate) {
                $encryptedDataEncryptionKey = $redisResult['encryptedDataEncryptionKey'];
            }
        }
        catch (\Exception) {
            //pass
        }

        if ($userIsPrivate == null) {
            try {
                $nonRedisResult = PublicUser::where('id', $userId)
                    ->select(['username'])
                    ->first();
                
                if ($nonRedisResult !== null) {
                    $userIsPrivate = false;
                }
                else {
                    $encryptedDataEncryptionKey = PrivateUser::where('id', $userId)
                        ->pluck('encryptedDataEncryptionKey')
                        ->first();
                    
                    if ($encryptedDataEncryptionKey !== null) {
                        $userIsPrivate = true;
                    }
                    else {
                        abort(404, "The user $userId does not exist");
                    }
                }
            }
            catch (\Exception) {
                abort(
                    502,
                    "There was trouble getting the account visibility status of user $userId from the database"
                );
            }
        }

        $authUserFollowsUser = null;

        if (!$authUserIsAnonymousGuest) {
            try {
                $response = Http::get(
                    "http://34.111.89.101/api/Home-Page/djangoBackend2/getAccessOfAuthUserToAnotherUser/$authUserId/$userId
                    /$userIsPrivate"
                );
    
                
                if ($response->failed()) {
                    abort(502, "The djangoBackend2 server had trouble checking whether or not you have access to user $userId");
                }
    
                $accessOfAuthUserToOtherUser = $response->body();
                
                if ($accessOfAuthUserToOtherUser === 'BLOCKING/BLOCKED') {
                    abort(404, "There user $userId does not exist");
                }
                else if ($accessOfAuthUserToOtherUser === 'DOES NOT FOLLOW') {
                    $authUserFollowsUser = false;
                }
                else {
                    $authUserFollowsUser = true;
                }
            }
            catch (\Exception) {
                abort(
                    502,
                    "There was trouble connecting to the djangoBackend2 server to check whether or not you have access to user $userId"
                );
            }
        }

        if ($userIsPrivate) {
            $plaintextDataEncryptionKey = null;

            try {
                $plaintextDataEncryptionKey = $this->encryptionAndDecryptionService->decryptEncryptedDataEncryptionKey(
                    $encryptedDataEncryptionKey,
                    'users',
                    "user$userId"
                );
            }
            catch (\Exception) {
                //pass
            }

            $created = null;
            $encryptedAccountBasedIn = null;
            $accountBasedInEncryptionIv = null;
            $accountBasedInEncryptionAuthTag = null;

            try {
                $redisResult = $this->redisClient->hMGet(
                    "dataForUser$userId",
                    ['created', 'encryptedAccountBasedIn', 'accountBasedInEncryptionIv', 'accountBasedInEncryptionAuthTag']
                );

                $created = $redisResult['created'];
                $encryptedAccountBasedIn = $redisResult['encryptedAccountBasedIn'] ?? '';
                $encryptedAccountBasedIn = $redisResult['encryptedAccountBasedIn'] ?? '';
                $accountBasedInEncryptionIv = $redisResult['accountBasedInEncryptionIv'] ?? '';
            }
            catch (\Exception){
                //pass
            }

            if ($created == null) {
                try {
                    $nonRedisResult = PublicUser::where('id', $userId)
                        ->select(
                            ['created', 'encryptedAccountBasedIn', 'accountBasedInEncryptionIv', 'accountBasedInEncryptionAuthTag']
                        )
                        ->first()
                        ->toArray();

                    $created = $nonRedisResult['created']->format('Y-m-d H:i:s');;
                    $encryptedAccountBasedIn = $nonRedisResult['encryptedAccountBasedIn'] ?? '';
                    $encryptedAccountBasedIn = $nonRedisResult['encryptedAccountBasedIn'] ?? '';
                    $accountBasedInEncryptionIv = $nonRedisResult['accountBasedInEncryptionIv'] ?? '';
                }
                catch (\Exception) {
                    abort(
                        502,
                        'There was trouble getting the asked-for data from the database'
                    );
                }
            }

            $accountBasedIn = 'Not Provided By User';
            if ($encryptedAccountBasedIn !== '' && $plaintextDataEncryptionKey !== null && (!$userIsPrivate || ($userIsPrivate &&
            $authUserIsAnonymousGuest || $authUserFollowsUser))) {
                $accountBasedIn = $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                    $encryptedAccountBasedIn,
                    $plaintextDataEncryptionKey,
                    $accountBasedInEncryptionIv,
                    $accountBasedInEncryptionAuthTag
                );
            }

            return [$created, $accountBasedIn];
        }
        else {
            $created = null;
            $accountBasedIn = null;

            try {
                $redisResult = $this->redisClient->hMGet(
                    "dataForUser$userId",
                    ['created', 'accountBasedIn']
                );

                $created = $redisResult['created'];
                $accountBasedIn = $redisResult['accountBasedIn'] ?? 'Not Provided By User';
            }
            catch (\Exception){
                //pass
            }

            if ($created == null) {
                try {
                    $nonRedisResult = PublicUser::where('id', $userId)
                        ->select(['created', 'accountBasedIn'])
                        ->first()
                        ->toArray();

                    $created = $nonRedisResult['created']->format('Y-m-d H:i:s');;
                    $accountBasedIn = $nonRedisResult['accountBasedIn'] ?? 'Not Provided By User';
                }
                catch (\Exception) {
                    abort(
                        502,
                        'There was trouble getting the asked-for data from the database'
                    );
                }
            }

            return [$created, $accountBasedIn];
        }
    }
}
