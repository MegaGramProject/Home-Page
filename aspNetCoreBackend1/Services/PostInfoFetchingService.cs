using System.Text;
using System.Text.Json;


namespace aspNetCoreBackend1.Services;


public class PostInfoFetchingService
{


    public async Task<object> checkIfUserIsAnAuthorAndAlsoGetEncryptionStatusOfPost(
        int authUserId, string overallPostId, HttpClient httpClientWithMutualTLS
    )
    {
        try
        {
            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Get,
                @$"http://34.111.89.101/api/Home-Page/expressJSBackend1/getAuthorsAndEncryptionStatusOfPost
                /{overallPostId}"
            );

            HttpResponseMessage response = await httpClientWithMutualTLS.SendAsync(request);
            
            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return (
                        @"There doesn't currently exist a post with the provided overallPostId",
                        "NOT_FOUND"
                    );                    
                }
                return (
                    @"The expressJSBackend1 server had trouble getting the authors and encryption-status of the post.",
                    "BAD_GATEWAY"
                );
            }

            string stringifiedResponseData = await response.Content.ReadAsStringAsync();
            Dictionary<string, object>? parsedResponseData = JsonSerializer.Deserialize<Dictionary<string, object>>(
                stringifiedResponseData
            );

            int[] authorsOfPost = (int[]) parsedResponseData!["authors"];
            bool? isEncrypted = (bool) parsedResponseData!["isEncrypted"];

            return (
                authorsOfPost.Contains(authUserId),
                isEncrypted
            );
        }
        catch
        {
            return (
                @"There was trouble connecting to the expressJSBackend1 server to get the authors and encryption-status of the
                post.",
                "BAD_GATEWAY"
            ); 
        }
    }


    public async Task<object> getPostEncryptionStatusIfUserHasAccessToPost(
        int? authUserId, string overallPostId, HttpClient httpClientWithMutualTLS
    )
    {  
        int[] authorsOfPost = [];
        bool isEncrypted = false;
        try
        {
            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Get,
                @$"http://34.111.89.101/api/Home-Page/expressJSBackend1/getAuthorsAndEncryptionStatusOfPost
                /{overallPostId}"
            );


            HttpResponseMessage response = await httpClientWithMutualTLS.SendAsync(request);
            

            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return (
                        @"There doesn't currently exist a post with the overallPostId that you provided.",
                        "NOT_FOUND"
                    );                    
                }
                return (
                    @"The expressJSBackend1 server had trouble getting the authors and encryption-status of the post.",
                    "BAD_GATEWAY"
                ); 
            }

            string stringifiedResponseData = await response.Content.ReadAsStringAsync();
            Dictionary<string, object>? parsedResponseData = JsonSerializer.Deserialize<Dictionary<string, object>>(
                stringifiedResponseData
            );

            authorsOfPost = (int[]) parsedResponseData!["authorsOfPost"];
            isEncrypted = (bool) parsedResponseData["isEncrypted"];

            foreach(int author in authorsOfPost)
            {
                if (author == authUserId)
                {
                    return isEncrypted;
                }
            }
        }
        catch
        {
            return (
                @"There was trouble connecting to the expressJSBackend1 server to get the authors and encryption-
                status of the post.",
                "BAD_GATEWAY"
            ); 
        }

        if (isEncrypted)
        {
            if (authUserId == null)
            {
               return (
                    @"As an anonymous guest, you do not have access to this private-post or any of the encrypted data
                    associated with it.",
                    "UNAUTHORIZED"
                );  
            } 

            try
            {
                HttpRequestMessage request1 = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"http://34.111.89.101/api/Home-Page/djangoBackend2/graphql"
                );

                request1.Content = new StringContent(
                    JsonSerializer.Serialize(new
                    {
                        query = @"query ($authUserId: Int!, $userIds: [Int!]!) {
                            checkIfUserFollowsAtLeastOneInList(authUserId: $authUserId, userIds: $userIds)
                        }",
                        variables = new
                        {
                            authUserId,
                            userIds = authorsOfPost
                        }
                    }),
                    Encoding.UTF8,
                    "application/json"
                );

                HttpResponseMessage response1 = await httpClientWithMutualTLS.SendAsync(request1);
                
                if (!response1.IsSuccessStatusCode)
                {
                    return (
                        @"The djangoBackend2 server had trouble verifying whether or not you follow at-least one of the
                        authors of this private-post.",
                        "BAD_GATEWAY"
                    ); 
                }

                string stringifiedDataForResponse1 = await response1.Content.ReadAsStringAsync();
                Dictionary<string, Dictionary<string, bool>>? parsedDataForResponse1 =  JsonSerializer.Deserialize<Dictionary<
                string, Dictionary<string, bool>>>(
                    stringifiedDataForResponse1
                );

                bool userFollowsAtLeastOneAuthor = parsedDataForResponse1!["data"]["checkIfUserFollowsAtLeastOneInList"];
                if (!userFollowsAtLeastOneAuthor) {
                    return (
                        @"You do not have access to any of the encrypted-data of this post since you do not follow
                        at-least one of its authors.",
                        "UNAUTHORIZED"
                    ); 
                }
            }
            catch
            {
                return (
                    @"There was trouble connecting to the djangoBackend2 server to verify whether or not you follow at-least 
                    one of the authors of this private-post.",
                    "BAD_GATEWAY"
                ); 
            }  
        }
        else
        {
            if (authUserId != null)
            {
                try
                {
                    HttpRequestMessage request2 = new HttpRequestMessage(
                        HttpMethod.Post,
                        @$"http://34.111.89.101/api/Home-Page/djangoBackend2/isEachUserInListInTheBlockingsOfAuthUser
                        /{authUserId}"
                    );

                    request2.Content = new StringContent(
                        JsonSerializer.Serialize(
                            new {
                                listOfUsers = authorsOfPost
                            }
                        ),
                        Encoding.UTF8,
                        "application/json"
                    );

                    HttpResponseMessage response2 = await httpClientWithMutualTLS.SendAsync(request2);

                    if (!response2.IsSuccessStatusCode)
                    {
                        return (
                            @"The djangoBackend2 server had trouble checking whether or not
                            each of the authors of this post either block you or are blocked by you.",
                            "BAD_GATEWAY"
                        ); 
                    }

                    string stringifiedResponse2Data = await response2.Content.ReadAsStringAsync();
                    bool? eachPostAuthorIsInAuthUserBlockings = JsonSerializer.Deserialize<bool>(
                        stringifiedResponse2Data
                    );
                    if (eachPostAuthorIsInAuthUserBlockings == true)
                    {
                        return (
                            "You are trying to access the data of a post that does not exist.",
                            "NOT_FOUND"
                        );
                    }
                }
                catch
                {
                    return (
                        @"There was trouble connecting to the djangoBackend2 server to check whether or not
                        each of the authors of this unencrypted post either block you or are blocked by you.",
                        "BAD_GATEWAY"
                    );
                }
            }
        }

        return isEncrypted;
    }

    public async Task<object> getAuthorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUser(
        int? authUserId, string overallPostId, HttpClient httpClientWithMutualTLS
    )
    {
        int[] authorsOfPost = [];
        bool isEncrypted = false;
        HashSet<int> setOfAuthUserFollowings = new HashSet<int>();
        HashSet<int> setOfAuthUserBlockings = new HashSet<int>();

        try
        {
            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Get,
                @$"http://34.111.89.101/api/Home-Page/expressJSBackend1/getAuthorsAndEncryptionStatusOfPost/{overallPostId}"
            );


            HttpResponseMessage response = await httpClientWithMutualTLS.SendAsync(request);
            

            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return (
                        @"There doesn't currently exist a post with the overallPostId that
                        you provided.",
                        "NOT_FOUND"
                    );
                    
                }
                return (
                    @"The expressJSBackend1 server had trouble getting the authors and encryption-status of the post.",
                    "BAD_GATEWAY"
                ); 
            }

            string stringifiedResponseData = await response.Content.ReadAsStringAsync();
            Dictionary<string, object>? parsedResponseData = JsonSerializer.Deserialize<Dictionary<string, object>>(
                stringifiedResponseData
            );

            authorsOfPost = (int[]) parsedResponseData!["authorsOfPost"];
            isEncrypted = (bool) parsedResponseData["isEncrypted"];
        }
        catch
        {
            return (
                @"There was trouble connecting to the expressJSBackend1 server to get the authors and encryption-
                status of the post.",
                "BAD_GATEWAY"
            ); 
        }

        if (authUserId == -1)
        {
            authUserId = null;
        }

        if (authUserId != null)
        {
            try
            {
                HttpRequestMessage request1 = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"http://34.111.89.101/api/Home-Page/djangoBackend2/getFollowingsAndBlockingsOfUser/{authUserId}"
                );

                HttpResponseMessage response1 = await httpClientWithMutualTLS.SendAsync(request1);
                
                if (!response1.IsSuccessStatusCode)
                {
                    return (
                        @"The djangoBackend2 server had trouble getting the people that you follow, as well
                        as the people who either block you or are blocked by you.",
                        "BAD_GATEWAY"
                    ); 
                }

                string stringifiedDataForResponse1 = await response1.Content.ReadAsStringAsync();
                Dictionary<string, object>? parsedDataForResponse1 = JsonSerializer.Deserialize<Dictionary<string, object>>(
                    stringifiedDataForResponse1
                );
                setOfAuthUserFollowings = new HashSet<int>((int[]) parsedDataForResponse1!["followings"]);
                setOfAuthUserBlockings = new HashSet<int>((int[]) parsedDataForResponse1!["blockings"]);
            }
            catch
            {
                return (
                    @"There was trouble connecting to the djangoBackend2 server to get the people that you follow, as well
                    as the people who either block you or are blocked by you.",
                    "BAD_GATEWAY"
                ); 
            }
        }


        return new Dictionary<string, object>
        {
            { "authorsOfPost", authorsOfPost },
            { "isEncrypted", isEncrypted },
            { "setOfAuthUserFollowings", setOfAuthUserFollowings },
            { "setOfAuthUserBlockings", setOfAuthUserBlockings },
        };
    }


    public async Task<object> GetOverallPostIdsOfEachUserInList(
        HttpClient httpClientWithMutualTLS, int[] listOfUserIds, int postsFromAtMostThisManyMonthsAgo,
        bool allUsersArePublic
    )
    {
        try
        {
            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Post,
                @$"http://34.111.89.101/api/Home-Page/expressJSBackend1/getTheOverallPostIdsOfEachUserInList
                /{postsFromAtMostThisManyMonthsAgo}/{allUsersArePublic}"
            );

            request.Content = new StringContent(
                JsonSerializer.Serialize(
                    new {
                        listOfUserIds,
                    }
                ),
                Encoding.UTF8,
                "application/json"
            );

            HttpResponseMessage response = await httpClientWithMutualTLS.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                return (
                    @"The expressJSBackend1 server had trouble getting the posts from at-most 2 months ago of each of the
                    users in the list",
                    "BAD_GATEWAY"
                ); 
            }

            string stringifiedResponseData = await response.Content.ReadAsStringAsync();
            Dictionary<string, object> parsedResponseData = JsonSerializer.Deserialize<Dictionary<string, object>>(
                stringifiedResponseData
            )!;
            Dictionary<string, int[]> overallPostIdsAndTheirAuthors = (Dictionary<string, int[]>) parsedResponseData[
                "overallPostIdsAndTheirAuthors"
            ];

            return overallPostIdsAndTheirAuthors;
        }
        catch
        {
            return (
                @"There was trouble connecting to the expressJSBackend1 server to get the posts from at-most 2 months ago of
                each of the users in the list",
                "BAD_GATEWAY"
            );
        }
    }


    public async Task<object> GetNumPostViewsOfEachOverallPostIdInList(
        HttpClient httpClientWithMutualTLS, List<string> overallPostIds
    )
    {
        try
        {
            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Post,
                "http://34.111.89.101/api/Home-Page/springBootBackend2/getNumPostViewsOfEachOverallPostIdInList"
            );

            request.Content = new StringContent(
                JsonSerializer.Serialize(
                    new {
                        overallPostIds
                    }
                ),
                Encoding.UTF8,
                "application/json"
            );

            HttpResponseMessage response = await httpClientWithMutualTLS.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                return (
                    @"The springBootBackend2 server had trouble getting the numPostViews received by the posts in the 
                    list",
                    "BAD_GATEWAY"
                ); 
            }

            string stringifiedResponseData = await response.Content.ReadAsStringAsync();
            Dictionary<string, int>? overallPostIdsAndTheirNumViews = JsonSerializer.Deserialize<Dictionary<string, int>>(
                stringifiedResponseData
            );

            return overallPostIdsAndTheirNumViews!;
        }
        catch
        {
            return (
                @"There was trouble connecting to the springBootBackend2 server to get the numPostViews received by the posts
                in the list",
                "BAD_GATEWAY"
            );
        }
    }


    public async Task<object> GetOverallPostIdsOfEachSponsoredPostThatAuthUserCanView(
        HttpClient httpClientWithMutualTLS, List<int> authUserFollowings, List<int> authUserBlockings,
        int postsFromAtMostThisManyMonthsAgo
    )
    {
        try
        {
            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Post,
                @$"http://34.111.89.101/api/Home-Page/expressJSBackend1
                /getTheOverallPostIdsOfEverySponsoredPostThatAuthUserCanView/{postsFromAtMostThisManyMonthsAgo}"
            );

            request.Content = new StringContent(
                JsonSerializer.Serialize(
                    new {
                        authUserFollowings,
                        authUserBlockings,
                    }
                ),
                Encoding.UTF8,
                "application/json"
            );

            HttpResponseMessage response = await httpClientWithMutualTLS.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                return (
                    @"The expressJSBackend1 server had trouble getting the sponsored posts from at-most 2 months ago that are
                    visible to the authUser",
                    "BAD_GATEWAY"
                ); 
            }

            string stringifiedResponseData = await response.Content.ReadAsStringAsync();
            Dictionary<string, object> parsedResponseData = JsonSerializer.Deserialize<Dictionary<string, object>>(
                stringifiedResponseData
            )!;
            Dictionary<string, int[]> overallPostIdsAndTheirAuthors = (Dictionary<string, int[]>) parsedResponseData[
                "overallPostIdsAndTheirAuthors"
            ];

            return overallPostIdsAndTheirAuthors;
        }
        catch
        {
            return (
                @"There was trouble connecting to the expressJSBackend1 server to get the sponsored posts from at-most 2
                months ago that are visible to the authUser",
                "BAD_GATEWAY"
            );
        }
    }


    public async Task<object> GetNumAdLinkClicksOfEachSponsoredOverallPostIdInList(
        HttpClient httpClientWithMutualTLS, List<string> sponsoredOverallPostIds
    )
    {
        try
        {
            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Post,
                "http://34.111.89.101/api/Home-Page/springBootBackend2/getNumAdLinkClicksOfEachSponsoredOverallPostIdInList"
            );

            request.Content = new StringContent(
                JsonSerializer.Serialize(
                    new {
                        sponsoredOverallPostIds
                    }
                ),
                Encoding.UTF8,
                "application/json"
            );

            HttpResponseMessage response = await httpClientWithMutualTLS.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                return (
                    @"The springBootBackend2 server had trouble getting the numAdLinkClicks received by the sponsored posts
                    of the list",
                    "BAD_GATEWAY"
                ); 
            }

            string stringifiedResponseData = await response.Content.ReadAsStringAsync();
            Dictionary<string, int> overallPostIdsAndTheirAdLinkClicks = JsonSerializer.Deserialize<Dictionary<string, int>>(
                stringifiedResponseData
            )!;

            return overallPostIdsAndTheirAdLinkClicks;
        }
        catch
        {
            return (
                @"There was trouble connecting to the springBootBackend2 server to get the numAdLinkClicks received by the
                sponsored posts in the list",
                "BAD_GATEWAY"
            );
        }
    }


    public async Task<object> GetNumPostViewsByAuthUserForEachOverallPostIdInList(
        HttpClient httpClientWithMutualTLS, List<string> overallPostIds, int authUserId
    )
    {
        try
        {
            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Post,
                @$"http://34.111.89.101/api/Home-Page/springBootBackend2
                /getNumPostViewsByAuthUserForEachOverallPostIdInList/{authUserId}"
            );

            request.Content = new StringContent(
                JsonSerializer.Serialize(
                    new {
                        overallPostIds
                    }
                ),
                Encoding.UTF8,
                "application/json"
            );

            HttpResponseMessage response = await httpClientWithMutualTLS.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                return (
                    @"The springBootBackend2 server had trouble getting the numPostViews by the authUser for each post in the 
                    list",
                    "BAD_GATEWAY"
                ); 
            }

            string stringifiedResponseData = await response.Content.ReadAsStringAsync();
            Dictionary<string, int>? overallPostIdsAndTheirNumViews = JsonSerializer.Deserialize<Dictionary<string, int>>(
                stringifiedResponseData
            );

            return overallPostIdsAndTheirNumViews!;
        }
        catch
        {
            return (
                @"There was trouble connecting to the springBootBackend2 server to get the numPostViews by the authUser for
                each post in the list",
                "BAD_GATEWAY"
            );
        }
    }

    public async Task<object> GetNumAdLinkClicksByAuthUserForEachSponsoredOverallPostIdInList(
        HttpClient httpClientWithMutualTLS, List<string> sponsoredOverallPostIds, int authUserId
    )
    {
        try
        {
            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Post,
                @$"http://34.111.89.101/api/Home-Page/springBootBackend2
                /GetNumAdLinkClicksByAuthUserForEachSponsoredOverallPostIdInList/{authUserId}"
            );

            request.Content = new StringContent(
                JsonSerializer.Serialize(
                    new {
                        sponsoredOverallPostIds
                    }
                ),
                Encoding.UTF8,
                "application/json"
            );

            HttpResponseMessage response = await httpClientWithMutualTLS.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                return (
                    @"The springBootBackend2 server had trouble getting the numAdLinkClicks by the authUser for
                    each sponsored post in the list",
                    "BAD_GATEWAY"
                ); 
            }

            string stringifiedResponseData = await response.Content.ReadAsStringAsync();
            Dictionary<string, int> overallPostIdsAndTheirAdLinkClicks = JsonSerializer.Deserialize<Dictionary<string, int>>(
                stringifiedResponseData
            )!;

            return overallPostIdsAndTheirAdLinkClicks;
        }
        catch
        {
            return (
                @"There was trouble connecting to the springBootBackend2 server to get the numAdLinkClicks by the authUser for
                each sponsored post in the list",
                "BAD_GATEWAY"
            );
        }
    }
}