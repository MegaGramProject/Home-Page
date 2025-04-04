<?php

namespace App\Services;

require '../vendor/autoload.php';

use Illuminate\Support\Facades\Http;
use DateTime;


class FollowInfoFetchingService {


    public function __construct() {}


    public function getUpdatedFollowersOfMultiplePublicUsers(DateTime $datetimeToCheckForUpdates, array $userIds) {
        try {
            $response = Http::withHeaders(
                [
                'Content-Type' => 'application/json',
                ]
            )->post(
                'http://34.111.89.101/api/Home-Page/djangoBackend2/graphql',
                [
                    'query' => 'query ($datetimeToCheckForUpdates: String!, $userIds: [Int!]!) {
                        fetchUpdatedFollowersOfMultiplePublicUsers(
                            datetimeToCheckForUpdates: $datetimeToCheckForUpdates, userIds: $userIds
                        )
                    }',
                    'variables' => [
                        'datetimeToCheckForUpdates' => $datetimeToCheckForUpdates->format('Y-m-d H:i:s'),
                        'userIds' => $userIds
                    ]
                ]
            );

            if ($response->failed()) {
                return [
                    'The djangoBackend2 server had trouble getting the updated followers of the public-users in the provided list',
                    'BAD_GATEWAY'
                ];
            }

            $stringifiedResponseData = $response->body();
            $parsedResponseData = json_decode($stringifiedResponseData, true);

            $newFollowers = $parsedResponseData['data']['fetchUpdatedFollowersOfMultiplePublicUsers'];
            return $newFollowers;
        }
        catch (\Exception) {
            return [
                'There was trouble connecting to the djangoBackend2 server to get the updated followers of the public-users in the
                provided list',
                'BAD_GATEWAY'
            ]; 
        }
    }


    public function getUpdatedFollowRequestsOfMultiplePrivateUsers(DateTime $datetimeToCheckForUpdates, array $userIds) {
            try {
                $response = Http::withHeaders(
                    [
                        'Content-Type' => 'application/json',
                    ]
                )->post(
                    'http://34.111.89.101/api/Home-Page/djangoBackend2/graphql',
                    [
                        'query' => 'query ($datetimeToCheckForUpdates: String!, $userIds: [Int!]!) {
                            fetchUpdatedFollowRequestsOfMultiplePrivateUsers(
                                datetimeToCheckForUpdates: $datetimeToCheckForUpdates, userIds: $userIds
                            )
                        }',
                        'variables' => [
                            'datetimeToCheckForUpdates' => $datetimeToCheckForUpdates->format('Y-m-d H:i:s'),
                            'userIds' => $userIds
                        ]
                    ]
                );

                if ($response->failed()) {
                    return [
                        'The djangoBackend2 server had trouble getting the updated follow-requests of the private-users in the provided
                        list',
                        'BAD_GATEWAY'
                    ];
                }

                $stringifiedResponseData = $response->body();
                $parsedResponseData = json_decode($stringifiedResponseData, true);

                $newFollowRequests = $parsedResponseData['data']['fetchUpdatedFollowRequestsOfMultiplePrivateUsers'];
                return $newFollowRequests;
            }
            catch (\Exception) {
                return [
                    'There was trouble connecting to the djangoBackend2 server to get the updated follow-requests of the private-users in
                    the provided list',
                    'BAD_GATEWAY'
                ]; 
            }
    }
}