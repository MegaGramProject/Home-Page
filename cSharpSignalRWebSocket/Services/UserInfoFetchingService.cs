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


    public async Task<object> GetUsernameOfUserId(int userId, HttpClient httpClient)
    {
        try
        {
            var requestBody = new
            {
                query = @"
                    query ($userIds: [Int!]!) {
                        getUsernameOfUserIdFromWebSocket(userIds: $userIds)
                    }",
                variables = new {userId }
            };

            string jsonRequest = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

            HttpResponseMessage response = await httpClient.PostAsync("http://34.111.89.101/laravelBackend1/graphql", content);

            if (!response.IsSuccessStatusCode)
            {
                return (
                    $"The laravelBackend1 server had trouble getting the username of user {userId}",
                    "BAD_GATEWAY"
                );
            }

            string jsonResponse = await response.Content.ReadAsStringAsync();
            using JsonDocument doc = JsonDocument.Parse(jsonResponse);

            string usernameOfUser = doc.RootElement
                .GetProperty("data")
                .GetProperty("getUsernameOfUserIdFromWebSocket")
                .GetString();

            return usernameOfUser;
        }
        catch
        {
            return (
                $"There was trouble connecting to the laravelBackend1 server to get the username of user {userId}",
                "BAD_GATEWAY"
            );
        }

    }
}