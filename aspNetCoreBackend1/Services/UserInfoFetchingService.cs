using System.Text.Json;
using System.Text;


namespace aspNetCoreBackend1.Services;


public class UserInfoFetchingService
{


    public async Task<object> GetTheUserIdsOfAllThePublicAccounts(
        HttpClient httpClientWithMutualTLS
    )
    {
        try
        {
            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Post,
                "http://34.111.89.101/api/Home-Page/laravelBackend1/graphql"
            );

            request.Content = new StringContent(
                JsonSerializer.Serialize(
                    new {
                        query =
                        @"query {
                            getIdsOfAllPublicUsers
                        }",
                    }
                ),
                Encoding.UTF8,
                "application/json"
            );

            HttpResponseMessage response = await httpClientWithMutualTLS.SendAsync(request);
            
            if (!response.IsSuccessStatusCode)
            {
                return (
                    "The laravelBackend1 server had trouble getting the user-ids of all the public-accounts",
                    "BAD_GATEWAY"
                ); 
            }

            string stringifiedResponseData = await response.Content.ReadAsStringAsync();
            Dictionary<string, Dictionary<string, int[]>>? parsedResponseData = JsonSerializer.Deserialize<
            Dictionary<string, Dictionary<string, int[]>>>(
                stringifiedResponseData
            );
            
            int[]? userIdsOfAllPublicAccounts = parsedResponseData!["data"]["getIdsOfAllPublicUsers"];
            return userIdsOfAllPublicAccounts!;
        }
        catch
        {
            return (
                "There was trouble connecting to the laravelBackend1 server to get the user-ids of all the public-accounts",
                "BAD_GATEWAY"
            );
        }
    }

    public async Task<object> GetTheMostFollowedUsersInList(
        HttpClient httpClientWithMutualTLS, int[] userIdsOfAllPublicAccounts, int limit
    )
    {
        try
        {
            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Post,
                $"http://34.111.89.101/api/Home-Page/djangoBackend2/graphql"
            );

            request.Content = new StringContent(
                JsonSerializer.Serialize(new
                {
                    query = @"query ($userIds: [Int!]!, $limit: Int) {
                        getTheMostFollowedUsersInList(userIds: $userIds, limit: $limit)
                    }",
                    variables = new
                    {
                        userIds = userIdsOfAllPublicAccounts,
                        limit
                    }
                }),
                Encoding.UTF8,
                "application/json"
            );

            HttpResponseMessage response = await httpClientWithMutualTLS.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                return (
                    $"The djangoBackend2 server had trouble getting the top {limit} most followed users in the list",
                    "BAD_GATEWAY"
                ); 
            }

            string stringifiedResponseData = await response.Content.ReadAsStringAsync();
            Dictionary<string, Dictionary<string, int[]>>? parsedResponseData = JsonSerializer.Deserialize<Dictionary<string,
            Dictionary<string, int[]>>>(
                stringifiedResponseData
            );
            int[] topMostFollowedUsersInList = parsedResponseData!["data"]["getTheMostFollowedUsersInList"];
            return topMostFollowedUsersInList!;
        }
        catch
        {
            return (
                @"There was trouble connecting to the djangoBackend2 server to get the top {limit} most followed users in the
                list",
                "BAD_GATEWAY"
            );
        }
    }    

    public async Task<object> GetTheFollowingsAndBlockingsOfUser(
        HttpClient httpClientWithMutualTLS, int authUserId
    )
    {
        try
        {
            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Get,
                $"http://34.111.89.101/api/Home-Page/djangoBackend2/getFollowingsAndBlockingsOfUser/{authUserId}"
            );
            HttpResponseMessage response = await httpClientWithMutualTLS.SendAsync(request);            

            if (!response.IsSuccessStatusCode)
            {
                return (
                    "The djangoBackend2 server had trouble retrieving the followings and blockings of the authUser",
                    "BAD_GATEWAY"
                );
            }
            else
            {
                string stringifiedResponseData = await response.Content.ReadAsStringAsync();
                Dictionary<string, object>? followingsAndBlockingsInfo = JsonSerializer.Deserialize<Dictionary<string, object>>(
                    stringifiedResponseData
                );
                return followingsAndBlockingsInfo!;
            }
        }
        catch
        {
            return (
                @"There was trouble connecting to the djangoBackend2 server to get the followings and blockings
                of the authUser",
                "BAD_GATEWAY"
            );
        }
    } 
}