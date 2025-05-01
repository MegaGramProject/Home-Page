<?php

namespace Services;

use Illuminate\Support\Facades\Http;


class UserInfoFetchingService {
    

    public function __construct() {}


    public function getUsernameOfUser(int $userId) {
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post(
                'http://34.111.89.101/api/Home-Page/laravelBackend1/graphql',
                [
                    'query' => 'query ($userId: Int!) {
                        getUsernameOfUserIdFromWebSocket(userId: $userId)
                    }',
                    'variables' => [
                        'userId' => $userId
                    ]
                ]
            );

            if ($response->failed()) {
                return "user $userId";
            }

            $stringifiedResponseData = $response->body();
            $parsedResponseData = json_decode($stringifiedResponseData, true);

            $usernameOfUser = $parsedResponseData['data']['getUsernameOfUserIdFromWebSocket'];
            return $usernameOfUser;
        }
        catch (\Exception) {
            return "user $userId";
        }
    }
}