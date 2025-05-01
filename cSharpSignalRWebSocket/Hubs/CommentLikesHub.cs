using cSharpSignalRWebSocket.Services;

using System.Threading.Tasks;
using System.Collections.Concurrent;

using Microsoft.AspNetCore.SignalR;


namespace cSharpSignalRWebSocket.Hubs;


public class CommentLikesHub : Hub
{   
    private readonly UserAuthService _userAuthService;
    private readonly UserInfoFetchingService _userInfoFetchingService;

    private readonly HttpClient _httpClient;
    
    private readonly ConcurrentDictionary<int, string> _userIdsAndTheirUsernames;

    private readonly ConcurrentDictionary<string, string> _connectionsAndTheirBackendIds;


    public CommentLikesHub(
        UserAuthService userAuthService, 
        UserInfoFetchingService userInfoFetchingService, 
       
        IHttpClientFactory httpClientFactory,

        ConcurrentDictionary<int, string> userIdsAndTheirUsernames,

        ConcurrentDictionary<string, string> connectionsAndTheirBackendIds
    )
    {
        _userAuthService = userAuthService;
        _userInfoFetchingService = userInfoFetchingService;
        
        _httpClient = httpClientFactory.CreateClient();

        _userIdsAndTheirUsernames = userIdsAndTheirUsernames;

        _connectionsAndTheirBackendIds = connectionsAndTheirBackendIds;
    }


    public override async Task OnConnectedAsync()
    {
        string connectionId = Context.ConnectionId;

        var httpContext = Context.GetHttpContext();

        bool userIdIsProvided = false;
        bool backendIdIsProvided = false;

        if (httpContext != null)
        {
            userIdIsProvided = httpContext.Request.Query.ContainsKey("userId");
            backendIdIsProvided = httpContext.Request.Query.ContainsKey("backendId");
        }

        if (httpContext == null || (!userIdIsProvided && !backendIdIsProvided) || (userIdIsProvided && backendIdIsProvided))
        {
            await Clients.Client(connectionId).SendAsync(
                "BadRequestError",
                @"You must either provide a userId query-param with user-auth-token-cookies, or a backend-id in order
                to proceed with this connection. Furthermore, you cannot provide both a userId and a backend-id.
                Because you didn't follow these rules, you are being disconnected."
            );

            await Task.Delay(2000);
            Context.Abort();
        }

        int? userId = null;

        if (userIdIsProvided)
        {
            bool userIdIsValid = true;

            try {
                userId = Int32.Parse(httpContext.Request.Query["userId"]);
                if (userId < 1)
                {
                    userIdIsValid = false;
                }
            }
            catch
            {
                userIdIsValid = false;
            }

            if (!userIdIsValid) 
            {
                await Clients.Client(connectionId).SendAsync(
                    "BadRequestError",
                    "The provided userId is invalid"
                );

                await Task.Delay(2000);
                Context.Abort();
            }

            var userAuthenticationResult = await _userAuthService.AuthenticateUser(
                (int) userId, httpContext.Request.Cookies, _httpClient
            );

            if (userAuthenticationResult is bool userAuthenticationResultAsBoolean)
            {
                if (!userAuthenticationResultAsBoolean)
                {
                    await Clients.Client(connectionId).SendAsync(
                        "UserAuthenticationError",
                        @$"The expressJSBackend1 server could not verify you as having the proper credentials to be logged in
                        as user {userId}"
                    );

                    await Task.Delay(2000);
                    Context.Abort();
                }
            }
            else if (userAuthenticationResult is string userAuthenticationResultAsString)
            {
                await Clients.Client(connectionId).SendAsync(
                    "UserAuthenticationError",
                    userAuthenticationResultAsString
                );

                await Task.Delay(2000);
                Context.Abort();
            }

            await Groups.AddToGroupAsync(connectionId, $"subscribersToLikeUpdatesOfCommentsOfUser{userId}");
        }

        string? backendId = null;

        if (backendIdIsProvided)
        {
            backendId = httpContext.Request.Query["backendId"];
            List<string> acceptedBackendIds = new List<string>(new string[] { "aspNetCoreBackend1" });

            if (!acceptedBackendIds.Contains(backendId!))
            {
                await Clients.Client(connectionId).SendAsync(
                    "BadRequestError",
                    "You are being disconnected because you provided an invalid backendId"
                );

                await Task.Delay(2000);
                Context.Abort();
            }

            _connectionsAndTheirBackendIds[connectionId] = backendId;
        }

        await base.OnConnectedAsync();
    }


    public async Task CommentLike(Dictionary<string, object> commentLikeInfo)
    {
        if (!_connectionsAndTheirBackendIds.ContainsKey(Context.ConnectionId))
        {
            return;
        }

        int likeId = (int) commentLikeInfo["likeId"];
        string overallPostId = (string) commentLikeInfo["overallPostId"];
        int authorId = (int) commentLikeInfo["authorId"];
        int likerId = (int) commentLikeInfo["likerId"];
        string comment = (string) commentLikeInfo["comment"];

        string likerName;

        if (_userIdsAndTheirUsernames.ContainsKey(likerId))
        {
            likerName = _userIdsAndTheirUsernames[likerId];
        }
        else
        {
            likerName = (string) await _userInfoFetchingService.GetUsernameOfUserId(likerId, _httpClient);
            if (!(likerName.Equals($"user {likerId}")))
            {
                _userIdsAndTheirUsernames[likerId] = likerName;
            }
        }

        await Clients.Group($"subscribersToLikeUpdatesOfCommentsOfUser{authorId}").SendAsync(
            "CommentLike",
            new
            {
                likeId = likeId,
                overallPostId = overallPostId,
                likerId = likerId,
                likerName = likerName,
                comment = comment
            }
        );
    }


    public async Task CommentUnlike(Dictionary<string, object> commentLikeInfo)
    {
        if (!_connectionsAndTheirBackendIds.ContainsKey(Context.ConnectionId))
        {
            return;
        }

        int likeId = (int) commentLikeInfo["likeId"];
        string overallPostId = (string) commentLikeInfo["overallPostId"];
        int authorId = (int) commentLikeInfo["authorId"];
        int likerId = (int) commentLikeInfo["likerId"];
        string comment = (string) commentLikeInfo["comment"];

        string likerName;

        if (_userIdsAndTheirUsernames.ContainsKey(likerId))
        {
            likerName = _userIdsAndTheirUsernames[likerId];
        }
        else
        {
            likerName = (string) await _userInfoFetchingService.GetUsernameOfUserId(likerId, _httpClient);
            if (!(likerName.Equals($"user {likerId}")))
            {
                _userIdsAndTheirUsernames[likerId] = likerName;
            }
        }

        await Clients.Group($"subscribersToLikeUpdatesOfCommentsOfUser{authorId}").SendAsync(
            "CommentUnlike",
            new
            {
                likeId = likeId,
                overallPostId = overallPostId,
                likerId = likerId,
                likerName = likerName,
                comment = comment
            }
        );
    }


    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _connectionsAndTheirBackendIds.TryRemove(Context.ConnectionId, out _);
    }
}
