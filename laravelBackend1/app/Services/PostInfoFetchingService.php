<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;


class PostInfoFetchingService {


    public function getPostEncryptionStatusIfUserHasAccessToPost(int $authUserId, string $overallPostId) {  
        $authorsOfPost = [];
        $isEncrypted = false;

        try {
            $response = Http::get(
                "http://34.111.89.101/api/Home-Page/expressJSBackend1/getAuthorsAndEncryptionStatusOfPost/$overallPostId"
            );

            
            if ($response->failed()) {
                if ($response->status() == 404) {
                    return [
                        "There doesn't currently exist a post with the overallPostId that you provided.",
                        'NOT_FOUND'
                    ];
                }

                return [
                    "The expressJSBackend1 server had trouble getting the authors and encryption-status of the
                    post.",
                    'BAD_GATEWAY'
                ];
            }

            $stringifiedResponseData = $response->body();
            $parsedResponseData = json_decode($stringifiedResponseData, true);

            $authorsOfPost = $parsedResponseData["authorsOfPost"];
            $isEncrypted = $parsedResponseData["isEncrypted"];
            
            if (in_array($authUserId, $authorsOfPost)) {
                return $isEncrypted;
            }
        }
        catch (\Exception) {
            return [
                "There was trouble connecting to the expressJSBackend1 server to get the authors and encryption-
                status of the post.",
                "BAD_GATEWAY"
            ]; 
        }

        if ($isEncrypted) {
            if ($authUserId == -1) {
               return [
                    "As an anonymous guest, you do not have access to this private-post or any of the encrypted
                    data associated with it.",
                    "UNAUTHORIZED"
               ];  
            } 

            try {
                $response1 = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->post(
                    "http://34.111.89.101/api/Home-Page/djangoBackend2/graphql",
                    [
                        'query' => 'query ($authUserId: Int!, $userIds: [Int!]!) {
                            checkIfUserFollowsAtLeastOneInList(authUserId: $authUserId, userIds: $userIds)
                        }',
                        'variables' => [
                            'authUserId' => $authUserId,
                            'userIds' => $authorsOfPost
                        ]
                    ]
                );
                
                if ($response1->failed()) {
                    return [
                        "The djangoBackend2 server had trouble verifying whether or not you follow at-least one of the
                        authors of this private-post.",
                        "BAD_GATEWAY"
                    ]; 
                }

                $parsedResponse1Data = $response1->json();
                $userFollowsAtLeastOneAuthor = (bool) $parsedResponse1Data['data']['checkIfUserFollowsAtLeastOneInList'];

                if (!$userFollowsAtLeastOneAuthor) {
                    return [
                        "You do not have access to any of the encrypted-data of this post since you do not follow
                        at-least one of its authors.",
                        "UNAUTHORIZED"
                    ]; 
                }
            }
            catch (\Exception) {
                return [
                    "There was trouble connecting to the djangoBackend2 server to verify whether or not you follow at-least 
                    one of the authors of this private-post.",
                    "BAD_GATEWAY"
                ]; 
            }  
        }
        else {
            if ($authUserId !== -1) {
                try
                {
                    $response2 = Http::withHeaders([
                        'Content-Type' => 'application/json'
                    ])->post("http://34.111.89.101/api/Home-Page/djangoBackend2/isEachUserInListInTheBlockingsOfAuthUser
                    /$authUserId", [
                        'user_ids' => $authorsOfPost
                    ]);

                    if ($response2->failed()) {
                        return [
                            "The djangoBackend2 server had trouble checking whether or not
                            each of the authors of this post either block you or are blocked by you.",
                            "BAD_GATEWAY"
                        ]; 
                    }

                    $stringifiedResponse2Data = $response2->body();
                    $eachPostAuthorIsInAuthUserBlockings = (bool) $stringifiedResponse2Data;
                    if ($eachPostAuthorIsInAuthUserBlockings)
                    {
                        return [
                            "You are trying to access the data of a post that does not exist.",
                            "NOT_FOUND"
                        ];
                    }
                }
                catch (\Exception) {
                    return [
                        "There was trouble connecting to the djangoBackend2 server to check whether or not
                        each of the authors of this unencrypted post either block you or are blocked by you.",
                        "BAD_GATEWAY"
                    ];
                }
            }
        }

        return $isEncrypted;
    }

    
    public function ifUserIsAnAuthorOfPostGetEncryptionStatus(int $authUserId, string $overallPostId) {
        try {
            $response = Http::get(
                "http://34.111.89.101/api/Home-Page/expressJSBackend1/getAuthorsAndEncryptionStatusOfPost/$overallPostId"
            );

            if ($response->failed()) {
                if ($response->status() == 404) {
                    return [
                        "There doesn't currently exist a post with the overallPostId that you provided.",
                        'NOT_FOUND'
                    ];
                }

                return [
                    "The expressJSBackend1 server had trouble getting the authors and encryption-status of the
                    post.",
                    'BAD_GATEWAY'
                ];
            }

            $stringifiedResponseData = $response->body();
            $parsedResponseData = json_decode($stringifiedResponseData, true);

            $authorsOfPost = $parsedResponseData["authorsOfPost"];
            $isEncrypted = $parsedResponseData["isEncrypted"];
            
            if (in_array($authUserId, $authorsOfPost)) {
                return $isEncrypted;
            }
            return [
                "You are not one of the authors of the post with this overallPostId-> $overallPostId",
                "UNAUTHORIZED"
            ];
        }
        catch (\Exception) {
            return [
                "There was trouble connecting to the expressJSBackend1 server to get the authors and encryption-
                status of the post.",
                "BAD_GATEWAY"
            ]; 
        }
    }
}