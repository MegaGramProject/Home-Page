using System.Text;
using System.Text.Json;

namespace cSharpSignalRWebSocket.Services;


public class CommentInfoFetchingService
{
    
    
    public CommentInfoFetchingService() {}
    
    
    public async Task<object> FetchCommentLikeUpdates(
        List<int> commentIds, DateTime datetimeForFetchingCommentLikeUpdates, HttpClient httpClient
    )
    {
        try
        {
            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Get,
                @$"http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/fetchUpdatesToLikesOfMultipleComments"
            );

            request.Content = new StringContent(
                JsonSerializer.Serialize(new
                {
                    datetimeForFetchingCommentLikeUpdates,
                    commentIds
                }),
                Encoding.UTF8,
                "application/json"
            );

            HttpResponseMessage response = await httpClient.SendAsync(request);
            
            if (!response.IsSuccessStatusCode)
            {
                return (
                    "The aspNetCoreBackend1 server had trouble getting the updates of each of the commentIds in the list",
                    "BAD_GATEWAY"
                );
            }

            string stringifiedResponseData = await response.Content.ReadAsStringAsync();
            Dictionary<string, object>? parsedResponseData =  JsonSerializer.Deserialize<Dictionary<string, object>>(
                stringifiedResponseData
            );
            List<Dictionary<string, int>> commentLikeUpdates = (List<Dictionary<string, int>>) parsedResponseData!["commentLikeUpdates"];

            return commentLikeUpdates;
        }
        catch
        {
            return (
                @"There was trouble connecting to the aspNetCoreBackend1 server to get the like-updates of each of the commentIds in the
                list",
                "BAD_GATEWAY"
            ); 
        }
    } 


    public async Task<object> FetchCommentReplyUpdates(
        List<int> commentIds, DateTime datetimeForFetchingCommentReplyUpdates, HttpClient httpClient
    )
    {
        try
        {
            HttpRequestMessage request = new HttpRequestMessage(
                HttpMethod.Get,
                @$"http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/fetchUpdatesToRepliesOfMultipleComments"
            );

            request.Content = new StringContent(
                JsonSerializer.Serialize(new
                {
                    datetimeForFetchingCommentReplyUpdates,
                    commentIds
                }),
                Encoding.UTF8,
                "application/json"
            );

            HttpResponseMessage response = await httpClient.SendAsync(request);
            
            if (!response.IsSuccessStatusCode)
            {
                return (
                    "The aspNetCoreBackend1 server had trouble getting the reply-updates of each of the commentIds in the list",
                    "BAD_GATEWAY"
                );
            }

            string stringifiedResponseData = await response.Content.ReadAsStringAsync();
            Dictionary<string, object>? parsedResponseData =  JsonSerializer.Deserialize<Dictionary<string, object>>(
                stringifiedResponseData
            );
            List<Dictionary<string, object>> commentReplyUpdates = (List<Dictionary<string, object>>) parsedResponseData![
                "commentReplyUpdates"
            ];

            return commentReplyUpdates;
        }
        catch
        {
            return (
                @"There was trouble connecting to the aspNetCoreBackend1 server to get the reply-updates of each of the commentIds in
                the list",
                "BAD_GATEWAY"
            ); 
        }
    } 
}