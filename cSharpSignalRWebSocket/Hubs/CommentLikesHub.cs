using cSharpSignalRWebSocket.Services;

using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace cSharpSignalRWebSocket.Hubs;


public class CommentLikesHub : Hub
{   
    private readonly UserAuthService _userAuthService;
    private readonly UserInfoFetchingService _userInfoFetchingService;
    private readonly CommentInfoFetchingService _commentInfoFetchingService;
    private readonly HttpClient _httpClient;
    
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _connectionsThatHaveNotRegisteredYet;
    private readonly ConcurrentDictionary<string, int> _connectionIdsAndTheirUserIds;
    private readonly ConcurrentDictionary<string, List<string>> _connectionIdsAndTheUpdatesTheyAreSubscribedTo;
    private readonly ConcurrentDictionary<string, HashSet<string>> _groupsAndTheirConnections;
    
    private readonly ConcurrentDictionary<int, string> _userIdsAndTheirUsernames;
    private readonly ConcurrentDictionary<int, List<int>> _usersAndTheirCommentIds;

    private commentIdsWhoseLikesAreMonitored = new List<int>();
    private DateTime datetimeForCheckingUpdatesOfCommentLikes;
    private CancellationTokenSource ctsForFetchingCommentLikeUpdates;
    private bool isCurrentlyFetchingCommentLikeUpdates = false;


    public CommentLikesHub(
        UserAuthService userAuthService, 
        UserInfoFetchingService userInfoFetchingService, 
        CommentInfoFetchingService commentInfoFetchingService,
        IHttpClientFactory httpClientFactory,

        ConcurrentDictionary<string, CancellationTokenSource> connectionsThatHaveNotRegisteredYet,
        ConcurrentDictionary<string, int> connectionIdsAndTheirUserIds,
        ConcurrentDictionary<string, List<string>> connectionIdsAndTheUpdatesTheyAreSubscribedTo,
        ConcurrentDictionary<string, HashSet<string>> groupsAndTheirConnections,

        ConcurrentDictionary<int, string> userIdsAndTheirUsernames,
        ConcurrentDictionary<int, List<int>> usersAndTheirCommentIds
    )
    {
        _userAuthService = userAuthService;
        _userInfoFetchingService = userInfoFetchingService;
        _commentInfoFetchingService = commentInfoFetchingService;
        _httpClient = httpClientFactory.CreateClient();
        
        _connectionsThatHaveNotRegisteredYet = connectionsThatHaveNotRegisteredYet;
        _connectionIdsAndTheirUserIds = connectionIdsAndTheirUserIds;
        _connectionIdsAndTheUpdatesTheyAreSubscribedTo = connectionIdsAndTheUpdatesTheyAreSubscribedTo;
        _groupsAndTheirConnections = groupsAndTheirConnections;

        _userIdsAndTheirUsernames = userIdsAndTheirUsernames;
        _usersAndTheirCommentIds = usersAndTheirCommentIds;
    }


    public override async Task OnConnectedAsync()
    {
        var connectionId = Context.ConnectionId;

        var httpContext = Context.GetHttpContext();
        if (httpContext == null) 
        {
            await Clients.Client(connectionId).SendAsync(
                "BadRequestError",
                "You must provide a userId as a query-param as well as user-auth-token-cookies in order to proceed with the connection"
            );
            await Task.Delay(2000);
            Context.Abort();
        }

        int userId = httpContext.Request.Query["userId"];

        if (userId < 1)
        {
            await Clients.Client(connectionId).SendAsync(
                "BadRequestError",
                "The provided userId is invalid"
            );
            await Task.Delay(2000);
            Context.Abort();
        }

        var userAuthenticationResult = await _userAuthService.AuthenticateUser(
            userId,  httpContext.Request.Cookies, _httpClient
        );

        if (userAuthenticationResult is bool userAuthenticationResultAsBoolean)
        {
            if (!userAuthenticationResultAsBoolean)
            {
                await Clients.Client(connectionId).SendAsync(
                    "UserAuthenticationError",
                    $"The expressJSBackend1 server could not verify you as having the proper credentials to be logged in as user {userId}"
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

        _connectionIdsAndTheirUserIds[connectionId] = userId;

        CancellationTokenSource cts = new CancellationTokenSource();
        _connectionsThatHaveNotRegisteredYet[connectionId] = cts;
        CancellationToken token = cts.Token;

        Task.Run(async () => // Run in background
        {
            try
            {
                await Task.Delay(15000); 
    
                _connectionsThatHaveNotRegisteredYet.TryRemove(connectionId, out _);
                await Clients.Client(connectionId).SendAsync(
                    "BadRequestError",
                    "You must acceptably register with updatesToSubscribeTo in order to stay connected to this WebSocket-server."
                );
                await Task.Delay(2000);
                Context.Abort();
            }
            catch (TaskCanceledException) { }
        }, token);


        await base.OnConnectedAsync();
    }

    public async Task RegisterWithUpdatesToSubscribeTo(List<string> updatesToSubscribeTo)
    {
        var connectionId = Context.ConnectionId;

        if (updatesToSubscribeTo.Count > 1)
        {
            await Clients.Client(connectionId).SendAsync(
                "BadRequestError",
                "There can only be at-most 1 update to subscribe to: comment-likes"
            );
            await Task.Delay(2000);
            Context.Abort();
        }

        List<string> validatedUpdatesToSubscribeTo = new List<string>();

        if (updatesToSubscribeTo.Contains("comment-likes")) {
            validatedUpdatesToSubscribeTo.Add("comment-likes");
        }

        if (validatedUpdatesToSubscribeTo.Count > 0 && _connectionsThatHaveNotRegisteredYet.TryRemove(
            connectionId, out var cts
        ))
        {
            cts.Cancel();

            _connectionIdsAndTheUpdatesTheyAreSubscribedTo[connectionId] = validatedUpdatesToSubscribeTo;

            int userId =  _connectionIdsAndTheirUserIds[connectionId];
            List<int> commentIdsOfUser = new List<int>();

            if (_usersAndTheirCommentIds.ContainsKey(userId))
            {
                commentIdsOfUser = _usersAndTheirCommentIds[userId];
            }
            else
            {
                commentIdsOfUser = _userInfoFetchingService.FetchListOfCommentIdsOfUser(
                    userId, _httpClient
                );
                if (commentIdsOfUser[1] === "BAD_GATEWAY")
                {
                    await Clients.Client(connectionId).SendAsync(
                        "BadGatewayError",
                        commentIdsOfUser[0]
                    );
                    await Task.Delay(2000);
                    Context.Abort();
                }
                else if (commentIdsOfUser.length == 0)
                {
                    await Clients.Client(connectionId).SendAsync(
                        "CommentsDoNotExistError",
                        "You have no comments, and hence cannot receive updates to the likes of comments that do not exist"
                    );
                    await Task.Delay(2000);
                    Context.Abort();
                }

                _usersAndTheirCommentIds[userId] = commentIdsOfUser;
            }

            HashSet<int> setOfCommentIdsWhoseLikesAreMonitored = new HashSet<int>(commentIdsWhoseLikesAreMonitored);

            foreach (int commentId in commentIdsOfUser)
            {
                setOfcommentIdsWhoseLikesAreMonitored.Add(commentId);
                await Groups.AddToGroupAsync(connectionId, "subscribersToLikeUpdatesOfComment"+commentId);

                if (!(_groupsAndTheirConnections.ContainsKey("subscribersToLikeUpdatesOfComment"+commentId)))
                {
                    _groupsAndTheirConnections["subscribersToLikeUpdatesOfComment"+commentId] = new HashSet<string>();
                }


                _groupsAndTheirConnections["subscribersToLikeUpdatesOfComment"+commentId].Add(connectionId);
            }

            commentIdsWhoseLikesAreMonitored = setOfCommentIdsWhoseLikesAreMonitored.toList();


            await Groups.AddToGroupAsync(connectionId, "subscribersToLikeUpdatesOfAComment");

            if (ctsForFetchingCommentLikeUpdates == null)
            {
                datetimeForCheckingUpdatesOfCommentLikes = DateTime.Now;
                ctsForFetchingCommentLikeUpdates = new CancellationTokenSource();
                CancellationToken token = ctsForFetchingCommentLikeUpdates.Token; 

                Task.Run(async () => // Run in background
                {
                    while (true)
                    {
                        await Task.Delay(5000);
                        var resultOfFetchingCommentLikeUpdates = _commentInfoFetchingService.FetchCommentLikeUpdates(
                            commentIdsWhoseLikesAreMonitored,
                            datetimeForCheckingUpdatesOfCommentLikes,
                            _httpClient
                        );

                        datetimeForCheckingUpdatesOfCommentLikes = DateTime.now;

                        if (resultOfFetchingCommentLikeUpdates is Tuple<string, string> resultOfFetchingCommentLikeUpdatesErrorOutput)
                        {
                            await Clients.Group("subscribersToLikeUpdatesOfAComment").SendAsync(
                                "CommentLikeFetchingError",
                                resultOfFetchingCommentLikeUpdatesErrorOutput.Item1
                            );
                        }
                        else if (resultOfFetchingCommentLikeUpdates is List<Dictionary<string, int>> commentLikeUpdates)
                        {
                            HashSet<int> setOfUserIdsToGetUsernamesOf = new HashSet<int>();
                            HashSet<int> commentIdsThatHaveLikersWithUnknownUsernames = new HashSet<int>();
                            Dictionary<int, List<int>> commentIdsAndTheirUpdatedLikes = new Dictionary<int, List<int>>();

                            foreach(Dictionary<string, int> commentLikeUpdate in commentLikeUpdates) {
                                int commentId = commentLikeUpdate["commentId"];
                                int likerId = commentLikeUpdate["likerId"];

                                if (!(userIdsAndTheirUsernames.ContainsKey(userIdsAndTheirUsernames))) {
                                    setOfUserIdsToGetUsernamesOf.add(likerId);
                                    commentIdsThatHaveLikersWithUnknownUsernames.add(commentId);
                                }
                                else {
                                    if (!(commentIdsAndTheirUpdatedLikes.ContainsKey(commentId))) {
                                        commentIdsAndTheirUpdatedLikes[commentId] = new List<int>();
                                    }

                                    commentIdsAndTheirUpdatedLikes[commentId].Add(likerId);
                                }
                            }

                            if (setOfUserIdsToGetUsernamesOf.Count > 0) {
                                var resultOfGettingUsernamesForListOfUserIds = await _userInfoFetchingService
                                .GetUsernamesForListOfUserIds(
                                    setOfUserIdsToGetUsernamesOf.toList()
                                );
                                if (resultOfGettingUsernamesForListOfUserIds is Tuple<string, string>
                                resultOfGettingUsernamesForListOfUserIdsErrorOutput) {
                                    foreach (int commentId in commentIdsThatHaveLikersWithUnknownUsernames) {
                                        await Clients.Group("subscribersToLikeUpdatesOfComment"+commentId).SendAsync(
                                            "UsernameFetchingError",
                                            resultOfGettingUsernamesForListOfUserIdsErrorOutput.Item1 + 
                                            @"in the non-empty list of updated-likers(whose usernames have not been fetched yet)
                                            of the post whose like-updates you are  subscribed to"
                                        );
                                    }


                                    foreach (int commentId in commentIdsThatHaveLikersWithUnknownUsernames) {
                                        HashSet<string> connectionsOfGroup = _groupsAndTheirConnections[
                                            "subscribersToLikeUpdatesOfComment"+commentId
                                        ];
                        
                                        foreach (string connectionId in connectionsOfGroup) {
                                            await Groups.AddToGroupAsync(
                                                connectionId,
                                                "subscribersToCommentsThatHaveLikersWithUnknownUsernames"
                                            );
                                        }
                                    }

                                    await Clients.Group("subscribersToCommentsThatHaveLikersWithUnknownUsernames").SendAsync(
                                        "UsernameFetchingError",
                                        resultOfGettingUsernamesForListOfUserIdsErrorOutput.Item1 + 
                                        @"in the non-empty list of updated-likers(whose usernames have not been fetched yet)
                                        of the post whose like-updates you are  subscribed to"
                                    );

                                   foreach (int commentId in commentIdsThatHaveLikersWithUnknownUsernames) {
                                        HashSet<string> connectionsOfGroup = _groupsAndTheirConnections[
                                            "subscribersToLikeUpdatesOfComment"+commentId
                                        ];
                        
                                        foreach (string connectionId in connectionsOfGroup) {
                                            await Groups.RemoveFromGroupAsync(
                                                connectionId,
                                                "subscribersToCommentsThatHaveLikersWithUnknownUsernames"
                                            );
                                        }
                                    }
                                }
                                else if (resultOfGettingUsernamesForListOfUserIds is List<Dictionary<int, string>> usernameForEachUserId)
                                {
                                    foreach (Dictionary<string, int> commentLikeUpdate in commentLikeUpdates) {
                                        int commentId = commentLikeUpdate["commentId"];
                                        int likerId = commentLikeUpdate["likerId"];

                                        if (setOfUserIdsToGetUsernamesOf.Contains(likerId) && usernameForEachUserId.Contains(likerId)) {
                                            if (!(commentIdsAndTheirUpdatedLikes.Contains(commentId))) {
                                                commentIdsAndTheirUpdatedLikes[commentId] = new List<int>();
                                            }
                            
                                            commentIdsAndTheirUpdatedLikes[commentId].Add(likerId);
                                        }
                                    }
                                    
                                    foreach (int userId in usernameForEachUserId.Keys) {
                                        _userIdsAndTheirUsernames[userId] = usernameForEachUserId[userId];
                                    }
                                }
                            }

                            foreach(int commentId of commentIdsAndTheirUpdatedLikes.Keys) {
                                List<int> updatedLikersOfComment = commentIdsAndTheirUpdatedLikes[commentId];
                                List<string> usernamesOfUpdatedLikersOfComment = new List<string>();

                                foreach(int updatedLikerOfComment in updatedLikersOfComment)
                                {
                                    usernamesOfUpdatedLikersOfComment.Add(
                                        _userIdsAndTheirUsernames[updatedLikerOfComment]
                                    );
                                }

                                await Clients.Group("subscribersToLikeUpdatesOfComment"+commentId).SendAsync(
                                    "UpdatedLikesOfComment",
                                    usernamesOfUpdatedLikersOfComment
                                );
                            }
                        }
                    }
                }, token);
            }
        }
    }


    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connectionId = Context.ConnectionId;

        _connectionsThatHaveNotRegisteredYet.TryRemove(connectionId, out _);

        List<int> commentIdsOfUser = _usersAndTheirCommentIds[userId];
        List<string> updatesThatThisConnectionIsSubscribedTo = _connectionIdsAndTheUpdatesTheyAreSubscribedTo[connectionId];

        foreach (int commentId in commentIdsOfUser)
        {
            int numSubscribersToLikeUpdatesOfThisComment = _groupsAndTheirConnections["subscribersToLikeUpdatesOfComment"+commentId].Count;

            numSubscribersToLikeUpdatesOfThisComment--;

            if (numSubscribersToLikeUpdatesOfThisComment==0)
            {
                commentIdsWhoseLikesAreMonitored = commentIdsWhoseLikesAreMonitored
                    .Where(elem => elem != commentId)
                    .ToList();


                if (commentIdsWhoseLikesAreMonitored.Count == 0)
                {
                    ctsForFetchingCommentLikeUpdates.Cancel();
                    ctsForFetchingCommentLikeUpdates.Dispose();
                    ctsForFetchingCommentLikeUpdates = null;
                    datetimeForCheckingUpdatesOfCommentLikes = null;
                }

                _groupsAndTheirConnections.Remove("subscribersToLikeUpdatesOfComment"+commentId);
            }
            else
            {
                _groupsAndTheirConnections["subscribersToLikeUpdatesOfComment"+commentId].Remove(connectionId);
            }
        }

        _connectionIdsAndTheUpdatesTheyAreSubscribedTo.TryRemove(connectionId, out _);

        _connectionIdsAndTheirUserIds.TryRemove(connectionId, out _);

        await base.OnDisconnectedAsync(exception);
    }

}
