<?php

namespace App\GraphQL\Queries\User;

use App\Models\MySQL\User\PublicUser;
use App\Models\MySQL\User\PrivateUser;

use App\Services\EncryptionAndDecryptionService;
use App\Services\UserAuthService;

use Rebing\GraphQL\Support\Query;
use GraphQL\Type\Definition\Type;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Http;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Carbon\Carbon;


class GetInDepthInfoOnUser extends Query {
    protected $redisClient;
    protected $userAuthService;
    protected $encryptionAndDecryptionService;

    protected $attributes = [
        'name' => 'getInDepthInfoOnUser',
    ];


    public function __construct(UserAuthService $userAuthService, EncryptionAndDecryptionService
    $encryptionAndDecryptionService) {
        $this->redisClient = Redis::connection()->client();
        $this->userAuthService = $userAuthService;
        $this->encryptionAndDecryptionService = $encryptionAndDecryptionService;
    }


    public function middleware(array $middleware) {
        return array_merge($middleware, ['throttle:graphql_rate-limit-8-per-min']);
    }
    

    public function type(): Type {
        return GraphQL::type('inDepthUserInfo');
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

        $userIsPrivate = null;

        try {
            $redisResult = $this->redisClient->hGet(
                "dataForUser$id",
                'isPrivate'
            );
            if ($redisResult !== null) {
                $userIsPrivate = $redisResult === 'true' ? true : false;
            }
        }
        catch (\Exception) {
            //pass
        }

        if ($userIsPrivate == null) {
            try {
                $nonRedisResult = PublicUser::where('id', $id)
                    ->select(['username'])
                    ->first();
                
                if ($nonRedisResult !== null) {
                    $userIsPrivate = false;
                }
                else {
                    $nonRedisResult = PrivateUser::where('id', $id)
                        ->select(['username'])
                        ->first();
                    
                    if ($nonRedisResult !== null) {
                        $userIsPrivate = true;
                    }
                    else {
                        abort(404, "The user $id does not exist");
                    }
                }

                try {
                    $redisResult = $this->redisClient->hSet(
                        "dataForUser$id",
                        'isPrivate',
                        $userIsPrivate == true ? 'true' : 'false'
                    );
                }
                catch (\Exception) {
                    //pass
                }
            }
            catch (\Exception) {
                abort(
                    502,
                    "There was trouble getting the account visibility status of user $id"
                );
            }
        }

        $authUserFollowsUser = null;

        if (!$authUserIsAnonymousGuest) {
            try {
                $response = Http::get(
                    "http://34.111.89.101/api/Home-Page/djangoBackend2/getAccessOfAuthUserToAnotherUser/$authUserId/$id/$userIsPrivate"
                );
    
                
                if ($response->failed()) {
                    abort(502, "The djangoBackend2 server had trouble checking whether or not you have access to user $id");
                }
    
                $accessOfAuthUserToOtherUser = $response->body();
                
                if ($accessOfAuthUserToOtherUser === 'BLOCKING/BLOCKED') {
                    abort(404, "There user $id does not exist");
                }
                else if ($accessOfAuthUserToOtherUser === 'DOES NOT FOLLOW') {
                    $authUserFollowsUser = false;
                }
            }
            catch (\Exception) {
                abort(
                    502,
                    "There was trouble connecting to the djangoBackend2 server to check whether or not you have access to user $id"
                );
            }
        }

        $output = [];

        if ($userIsPrivate && ($authUserIsAnonymousGuest || $authUserFollowsUser == false)) {
            try {
                $redisResult = $this->redisClient->hMGet(
                    "dataForUser$id",
                    ['username', 'fullName', 'isVerified', 'created']
                );

                $allFieldsArePresent = true;
                foreach(array_keys($redisResult) as $userDataField) {
                    if ($redisResult[$userDataField] == null) {
                        $allFieldsArePresent = false;
                        break;
                    }
                }

                if ($allFieldsArePresent) {
                    return Response::json([
                        'username' => $redisResult['username'],
                        'fullName' => $redisResult['fullName'],
                        'isVerified' => $redisResult['isVerified'] === 'true' ? true : false,
                        'created' => Carbon::parse($redisResult['created']),
                        'isPrivate' => true
                    ]);
                }
            }
            catch (\Exception) {
                //pass
            }

            try {
                $nonRedisResult = PrivateUser::where('id', $id)
                    ->select(['username', 'fullName', 'isVerified', 'created'])
                    ->first()
                    ->toArray();
                
                $output = [
                    'username' => $nonRedisResult['username'],
                    'fullName' => $nonRedisResult['fullName'],
                    'isVerified' => $nonRedisResult['isVerified'],
                    'created' => $nonRedisResult['created'],
                    'isPrivate' => true
                ];
            }
            catch (\Exception) {
                abort(502, "There was trouble fetching the data of user $id");
            }

            try {
                $this->redisClient->hMSet(
                    "dataForUser$id",
                    [
                        'username' => $output['username'],
                        'fullName' => $output['fullName'],
                        'isVerified' => $output['isVerified'] == true ? 'true' : 'false',
                        'created' => $output['created']->toIso8601String(),
                        'isPrivate' => 'true'
                    ]
                );
            }
            catch (\Exception) {
                //pass
            }
        }
        else {
            $username = null;
            $fullName = null;
            $isVerified = null;
            $dateOfBirth = null;
            $created = null;
            $accountBasedIn = null;
            $encryptedDateOfBirth = null;
            $encryptedAccountBasedIn = null;
            $dateOfBirthEncryptionIv = null;
            $accountBasedInEncryptionIv = null;
            $dateOfBirthEncryptionAuthTag = null;
            $accountBasedInEncryptionAuthTag = null;
            $encryptedDataEncryptionKey = null;

            $fieldsToGet = [];

            if (!$userIsPrivate) {
                $fieldsToGet = ['username', 'fullName', 'isVerified', 'dateOfBirth', 'created', 'accountBasedIn',
                'encryptedDataEncryptionKey'];
            }
            else {
                $fieldsToGet = ['username', 'fullName', 'isVerified', 'created', 'encryptedDateOfBirth',
                'encryptedAccountBasedIn', 'dateOfBirthEncryptionIv', 'accountBasedInEncryptionIv',
                'dateOfBirthEncryptionAuthTag', 'accountBasedInEncryptionAuthTag', 'encryptedDataEncryptionKey'];
            }

            $redisResult = null;
            $allFieldsWereFound = false;

            try {
                $redisResult = $this->redisClient->hMGet(
                    "dataForUser$id",
                    $fieldsToGet
                );

                $allFieldsWereFound = true;
                foreach($fieldsToGet as $userField) {
                    if ($redisResult[$userField] == null) {
                        $allFieldsWereFound = false;
                        break;
                    }
                }
            }
            catch (\Exception) {
                //pass
            }

            if ($allFieldsWereFound) {
                if (!$userIsPrivate) {
                    $username = $redisResult['username'];
                    $fullName = $redisResult['fullName'];
                    $isVerified = $redisResult['isVerified'] === 'true' ? true : false;
                    $dateOfBirth = Carbon::parse($redisResult['dateOfBirth']);
                    $created = Carbon::parse($redisResult['created']);
                    $accountBasedIn = $redisResult['accountBasedIn'];
                    $encryptedDataEncryptionKey = $redisResult['encryptedDataEncryptionKey'];
                }
                else {
                    $username = $redisResult['username'];
                    $fullName = $redisResult['fullName'];
                    $isVerified = $redisResult['isVerified'] === 'true' ? true : false;
                    $created = Carbon::parse($redisResult['created']);
                    $encryptedDateOfBirth = $redisResult['encryptedDateOfBirth'];
                    $encryptedAccountBasedIn = $redisResult['encryptedAccountBasedIn'];
                    $dateOfBirthEncryptionIv = $redisResult['dateOfBirthEncryptionIv'];
                    $accountBasedInEncryptionIv = $redisResult['accountBasedInEncryptionIv'];
                    $dateOfBirthEncryptionAuthTag = $redisResult['dateOfBirthEncryptionAuthTag'];
                    $accountBasedInEncryptionAuthTag = $redisResult['accountBasedInEncryptionAuthTag'];
                    $encryptedDataEncryptionKey = $redisResult['encryptedDataEncryptionKey'];
                }
            }
            else {
                if (!$userIsPrivate) {
                    try {
                        $nonRedisResult = PublicUser::where('id', $id)
                            ->select($fieldsToGet)
                            ->first()
                            ->toArray();
                        
                        $username = $nonRedisResult['username'];
                        $fullName = $nonRedisResult['fullName'];
                        $isVerified = $nonRedisResult['isVerified'];
                        $dateOfBirth = $nonRedisResult['dateOfBirth'];
                        $created = $nonRedisResult['created'];
                        $accountBasedIn = $nonRedisResult['accountBasedIn'];
                        $encryptedDataEncryptionKey = $nonRedisResult['encryptedDataEncryptionKey'];
                    }
                    catch (\Exception) {
                        abort(502, "There was trouble fetching the in-depth info of user $id");
                    }

                    try {
                        $this->redisClient->hMSet(
                            "dataForUser$id",
                            [
                                'username' => $username,
                                'fullName' => $fullName,
                                'isVerified' => $isVerified == true ? 'true' : 'false',
                                'dateOfBirth' => $dateOfBirth->toIso8601String(),
                                'created' => $created->toIso8601String(),
                                'accountBasedIn' => $accountBasedIn,
                                'encryptedDataEncryptionKey' => $encryptedDataEncryptionKey
                            ]
                        );
                    }
                    catch (\Exception) {
                        //pass
                    }
                }
                else {
                    try {
                        $nonRedisResult = PrivateUser::where('id', $id)
                            ->select($fieldsToGet)
                            ->first()
                            ->toArray();
                        
                        $username = $nonRedisResult['username'];
                        $fullName = $nonRedisResult['fullName'];
                        $isVerified = $nonRedisResult['isVerified'];
                        $created = $nonRedisResult['created'];
                        
                        $encryptedDateOfBirth = $nonRedisResult['encryptedDateOfBirth'];
                        $encryptedAccountBasedIn = $nonRedisResult['encryptedAccountBasedIn'];
                        
                        $dateOfBirthEncryptionIv = $nonRedisResult['dateOfBirthEncryptionIv'];
                        $accountBasedInEncryptionIv = $nonRedisResult['accountBasedInEncryptionIv'];
                        
                        $dateOfBirthEncryptionAuthTag = $nonRedisResult['dateOfBirthEncryptionAuthTag'];
                        $accountBasedInEncryptionAuthTag = $nonRedisResult['accountBasedInEncryptionAuthTag'];
                        
                        $encryptedDataEncryptionKey = $nonRedisResult['encryptedDataEncryptionKey'];
                    }
                    catch (\Exception) {
                        abort(502, "There was trouble fetching the in-depth info of user $id");
                    }

                    try {
                        $this->redisClient->hMSet(
                            "dataForUser$id",
                            [
                                'username' => $username,
                                'fullName' => $fullName,
                                'isVerified' => $isVerified == true ? 'true' : 'false',
                                'created' => $created->toIso8601String(),

                                'encryptedDateOfBirth' => $encryptedDateOfBirth,
                                'encryptedAccountBasedIn' => $encryptedAccountBasedIn,

                                'dateOfBirthEncryptionIv' => $dateOfBirthEncryptionIv,
                                'accountBasedInEncryptionIv' => $accountBasedInEncryptionIv,

                                'dateOfBirthEncryptionAuthTag' => $dateOfBirthEncryptionAuthTag,
                                'accountBasedInEncryptionAuthTag' => $accountBasedInEncryptionAuthTag,

                                'encryptedDataEncryptionKey' => $encryptedDataEncryptionKey
                            ]
                        );
                    }
                    catch (\Exception) {
                        //pass
                    }
                }
            }

            $plaintextDataEncryptionKey = null;

            try {
                $plaintextDataEncryptionKey = $this->encryptionAndDecryptionService->decryptEncryptedDataEncryptionKey(
                    $encryptedDataEncryptionKey,
                    'users',
                    "user$id"
                );
            }
            catch (\Exception) {
                abort(502, "There was trouble decrypting the encrypted data-encryption-key, a necessary step in
                decrypting the in-depth info on user $id");
            }

            if ($userIsPrivate) {
                $accountBasedIn = $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                    $encryptedAccountBasedIn,
                    $plaintextDataEncryptionKey,
                    $accountBasedInEncryptionIv,
                    $accountBasedInEncryptionAuthTag
                );
                $dateOfBirth = $this->encryptionAndDecryptionService->decryptDataWithDataEncryptionKey(
                    $encryptedDateOfBirth,
                    $plaintextDataEncryptionKey,
                    $dateOfBirthEncryptionIv,
                    $dateOfBirthEncryptionAuthTag
                );
                $dateOfBirth = Carbon::parse($dateOfBirth);
            }

            $output = [
                'username' => $username,
                'fullName' => $fullName,
                'isVerified' => $isVerified,
                'dateOfBirth' => $dateOfBirth,
                'created' => $created,
                'accountBasedIn' => $accountBasedIn,
                'isPrivate' => $userIsPrivate
            ];
        }

        return Response::json(
            $output
        );
    }
}
