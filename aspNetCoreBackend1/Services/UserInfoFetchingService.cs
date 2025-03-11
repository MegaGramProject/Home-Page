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
                HttpMethod.Get,
                "http://34.111.89.101/api/Home-Page/laravelBackend1/getTheUserIdsOfAllThePublicAccounts"
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
            int[]? userIdsOfAllPublicAccounts = JsonSerializer.Deserialize<int[]>(
                stringifiedResponseData
            );
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
                $"http://34.111.89.101/api/Home-Page/djangoBackend2/getTheMostFollowedUsersInList/{limit}"
            );

            request.Content = new StringContent(
                JsonSerializer.Serialize(
                    new {
                        list = userIdsOfAllPublicAccounts
                    }
                ),
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
            int[]? topMostFollowedUsersInList = JsonSerializer.Deserialize<int[]>(
                stringifiedResponseData
            );
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
                $"http://34.111.89.101/api/Home-Page/djangoBackend2/getFollowingsAndBlockingsOfAuthUser/{authUserId}"
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
                Dictionary<string, int[]>? followingsAndBlockingsInfo = JsonSerializer.Deserialize<Dictionary<string, int[]>>(
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