<?php

namespace App\Services;

require '../vendor/autoload.php';

use Illuminate\Support\Facades\Http;


class UserInfoFetchingService {
    

    public function __construct() {}


    public function getIsPrivateStatusOfUser(int $userId) {
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post(
                'http://34.111.89.101/api/Home-Page/laravelBackend1/graphql',
                [
                    'query' => 'query ($authUserId: Int!, $userIds: [Int!]!) {
                        getIsPrivateStatusesOfList(authUserId: $authUserId, userIds: $userIds)
                    }',
                    'variables' => [
                        'authUserId' => $userId,
                        'userIds' => [$userId]
                    ]
                ]
            );

            if ($response->failed()) {
                return [
                    "The laravelBackend1 server had trouble getting the isPrivate status of user $userId",
                    'BAD_GATEWAY'
                ];
            }

            $stringifiedResponseData = $response->body();
            $parsedResponseData = json_decode($stringifiedResponseData, true);

            $isPrivateStatusOfUser = $parsedResponseData['data']['getIsPrivateStatusesOfList'][0];
            return $isPrivateStatusOfUser;
        }
        catch (\Exception) {
            return [
                "There was trouble connecting to the laravelBackend1 server to get the isPrivate status of user $userId",
                'BAD_GATEWAY'
            ]; 
        }
    }
}