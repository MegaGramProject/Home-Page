using System.Text;
using System.Text.Json;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace cSharpSignalRWebSocket.Services;


public class UserInfoFetchingService
{


    public UserInfoFetchingService() {}

    
    public async Task<object> FetchListOfCommentIdsOfUser(
        int userId, HttpClient httpClient
    )
    {
        try
        {
            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Get,
                @$"http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getCommentIdsOfUser/{userId}"
            );

            HttpResponseMessage response = await httpClient.SendAsync(request);
            
            if (!response.IsSuccessStatusCode)
            {
                return (
                    @$"The aspNetCoreBackend1 server had trouble getting the ids of all the comments of user
                    {userId}",
                    "BAD_GATEWAY"
                );
            }

            string stringifiedResponseData = await response.Content.ReadAsStringAsync();
            Dictionary<string, object>? parsedResponseData =  JsonSerializer.Deserialize<Dictionary<string, object>>(
                stringifiedResponseData
            );
            List<int> commentIdsOfUser = (List<int>>) parsedResponseData!["commentIdsOfUser"];

            return commentIdsOfUser;
        }
        catch
        {
            return (
                @$"There was trouble connecting to the aspNetCoreBackend1 server to get the ids of all the comments of 
                user {userId}",
                "BAD_GATEWAY"
            ); 
        }
    } 


    public async Task<object> GetUsernamesForListOfUserIds(
        List<int> userIds, HttpClient httpClient
    ) {
        try
        {
            var requestBody = new
            {
                query = @"
                    query ($userIds: [Int!]!) {
                        getUsernamesForListOfUserIds(userIds: $userIds)
                    }",
                variables = new { userIds }
            };

            string jsonRequest = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

            HttpResponseMessage response = await httpClient.PostAsync("http://34.111.89.101/laravelBackend1/graphql", content);

            if (!response.IsSuccessStatusCode)
            {
                return (
                    "The laravelBackend1 server had trouble getting the usernames for each of the userIds",
                    "BAD_GATEWAY"
                );
            }

            string jsonResponse = await response.Content.ReadAsStringAsync();
            using JsonDocument doc = JsonDocument.Parse(jsonResponse);

            var listOfUsernames = doc.RootElement
                .GetProperty("data")
                .GetProperty("getUsernamesForListOfUserIds")
                .EnumerateArray();

            var usernameForEachUserId = new Dictionary<int, string>();

            int index = 0;
            foreach (var usernameElement in listOfUsernames)
            {
                if (usernameElement.ValueKind != JsonValueKind.Null)
                {
                    usernameForEachUserId[userIds[index]] = usernameElement.GetString();
                }
                index++;
            }

            return usernameForEachUserId;
        }
        catch
        {
            return (
                "There was trouble connecting to the laravelBackend1 server to get the usernames for each of the userIds",
                "BAD_GATEWAY"
            );
        }

    }
}