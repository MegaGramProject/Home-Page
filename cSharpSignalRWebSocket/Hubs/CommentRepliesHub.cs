using cSharpSignalRWebSocket.Services;

using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace cSharpSignalRWebSocket.Hubs;


public class CommentRepliesHub : Hub
{   
    private readonly UserAuthService _userAuthService;
    private readonly UserInfoFetchingService _userInfoFetchingService;
    private readonly CommentInfoFetchingService _commentInfoFetchingService;
    private readonly HttpClient _httpClient;
    
    private readonly ConcurrentDictionary<string, HashSet<string>> _groupsAndTheirConnections;
    
    private readonly ConcurrentDictionary<int, string> _userIdsAndTheirUsernames;
    private readonly ConcurrentDictionary<int, HashSet<int>> _usersAndTheirSetOfCommentIds;

    private commentIdsWhoseRepliesAreMonitored = new List<int>();
    private DateTime datetimeForCheckingUpdatesOfCommentReplies;
    private CancellationTokenSource ctsForFetchingCommentReplyUpdates;
    private bool isCurrentlyFetchingCommentReplyUpdates = false;


    public CommentRepliesHub(
        UserAuthService userAuthService, 
        UserInfoFetchingService userInfoFetchingService, 
        CommentInfoFetchingService commentInfoFetchingService,
        IHttpClientFactory httpClientFactory,

        ConcurrentDictionary<string, HashSet<string>> groupsAndTheirConnections,

        ConcurrentDictionary<int, string> userIdsAndTheirUsernames,
        ConcurrentDictionary<int, List<int>> usersAndTheirSetOfCommentIds
    )
    {
        _userAuthService = userAuthService;
        _userInfoFetchingService = userInfoFetchingService;
        _commentInfoFetchingService = commentInfoFetchingService;
        _httpClient = httpClientFactory.CreateClient();
        
        _groupsAndTheirConnections = groupsAndTheirConnections;

        _userIdsAndTheirUsernames = userIdsAndTheirUsernames;
        _usersAndTheirSetOfCommentIds = usersAndTheirSetOfCommentIds;
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
            await Task.Delay(3000);
            Context.Abort();
        }

        int userId = httpContext.Request.Query["userId"];

        if (userId < 1)
        {
            await Clients.Client(connectionId).SendAsync(
                "BadRequestError",
                "The provided userId is invalid"
            );
            await Task.Delay(3000);
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
                await Task.Delay(3000);
                Context.Abort();
            }
        }
        else if (userAuthenticationResult is string userAuthenticationResultAsString)
        {
            await Clients.Client(connectionId).SendAsync(
                "UserAuthenticationError",
                userAuthenticationResultAsString
            );
            await Task.Delay(3000);
            Context.Abort();
        }

        HashSet<int> commentIdsOfUser = new HashSet<int>();

        if (_usersAndTheirSetOfCommentIds.ContainsKey(userId))
        {
            commentIdsOfUser = _usersAndTheirSetOfCommentIds[userId];
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
                await Task.Delay(3000);
                Context.Abort();
            }
            else if (commentIdsOfUser.Count == 0)
            {
                await Clients.Client(connectionId).SendAsync(
                    "CommentsDoNotExistError",
                    "You have no comments, and hence cannot receive updates to the replies of comments that do not exist"
                );
                await Task.Delay(3000);
                Context.Abort();
            }

            _usersAndTheirSetOfCommentIds[userId] = commentIdsOfUser;
        }

        HashSet<int> setOfCommentIdsWhoseRepliesAreMonitored = new HashSet<int>(commentIdsWhoseRepliesAreMonitored);

        foreach (int commentId in commentIdsOfUser)
        {
            setOfCommentIdsWhoseRepliesAreMonitored.Add(commentId);
            await Groups.AddToGroupAsync(connectionId, "subscribersToReplyUpdatesOfComment"+commentId);

            if (!(_groupsAndTheirConnections.ContainsKey("subscribersToReplyUpdatesOfComment"+commentId)))
            {
                _groupsAndTheirConnections["subscribersToReplyUpdatesOfComment"+commentId] = new HashSet<string>();
            }


            _groupsAndTheirConnections["subscribersToReplyUpdatesOfComment"+commentId].Add(connectionId);
        }

        commentIdsWhoseRepliesAreMonitored = setOfCommentIdsWhoseRepliesAreMonitored.toList();


        await Groups.AddToGroupAsync(connectionId, "subscribersToReplyUpdatesOfAComment");

        if (ctsForFetchingCommentReplyUpdates == null)
        {
            datetimeForCheckingUpdatesOfCommentReplies = DateTime.Now;
            ctsForFetchingCommentReplyUpdates = new CancellationTokenSource();
            CancellationToken token = ctsForFetchingCommentReplyUpdates.Token; 

            Task.Run(async () => // Run in background
            {
                while (true)
                {
                    await Task.Delay(5000);
                    if (isCurrentlyFetchingCommentReplyUpdates)
                    {
                        return;
                    }
                    isCurrentlyFetchingCommentReplyUpdates = true;

                    var resultOfFetchingCommentReplyUpdates = _commentInfoFetchingService.FetchCommentReplyUpdates(
                        commentIdsWhoseRepliesAreMonitored,
                        datetimeForCheckingUpdatesOfCommentReplies,
                        _httpClient
                    );

                    datetimeForCheckingUpdatesOfCommentReplies = DateTime.now;

                    if (resultOfFetchingCommentReplyUpdates is Tuple<string, string> resultOfFetchingCommentReplyUpdatesErrorOutput)
                    {
                        await Clients.Group("subscribersToReplyUpdatesOfAComment").SendAsync(
                            "CommentReplyFetchingError",
                            resultOfFetchingCommentReplyUpdatesErrorOutput.Item1
                        );
                    }
                    else if (resultOfFetchingCommentReplyUpdates is List<Dictionary<string, object>> commentReplyUpdates)
                    {
                        HashSet<int> setOfUserIdsToGetUsernamesOf = new HashSet<int>();
                        HashSet<int> commentIdsThatHaveRepliersWithUnknownUsernames = new HashSet<int>();
                        Dictionary<int, List<Dictionary<string, object>> commentIdsAndTheirUpdatedReplies =
                        new Dictionary<int, List<Dictionary<string, object>>>();

                        foreach(Dictionary<string, object> commentReplyUpdate in commentReplyUpdates) {
                            int parentCommentId = (int) commentReplyUpdate["parentCommentId"];
                            int commenterId = (int) commentReplyUpdate["authorId"];
                            string comment = (string) commentReplyUpdate["content"];

                            if (!(userIdsAndTheirUsernames.ContainsKey(commenterId))) {
                                setOfUserIdsToGetUsernamesOf.add(commenterId);
                                commentIdsThatHaveRepliersWithUnknownUsernames.add(parentCommentId);
                            }
                            else {
                                if (!(commentIdsAndTheirUpdatedReplies.ContainsKey(parentCommentId))) {
                                    commentIdsAndTheirUpdatedReplies[parentCommentId] = new List<Dictionary<string, object>>();
                                }

                                commentIdsAndTheirUpdatedReplies[parentCommentId].Add(new Dictionary<string, object> {
                                    {"commenterId", commenterId}
                                    {"comment", comment}
                                }); 
                            }
                        }

                        if (setOfUserIdsToGetUsernamesOf.Count > 0) {
                            var resultOfGettingUsernamesForListOfUserIds = await _userInfoFetchingService
                            .GetUsernamesForListOfUserIds(
                                setOfUserIdsToGetUsernamesOf.toList()
                            );
                            if (resultOfGettingUsernamesForListOfUserIds is Tuple<string, string>
                            resultOfGettingUsernamesForListOfUserIdsErrorOutput) {
                                foreach (int commentId in commentIdsThatHaveRepliersWithUnknownUsernames) {
                                    HashSet<string> connectionsOfGroup = _groupsAndTheirConnections[
                                        "subscribersToReplyUpdatesOfComment"+commentId
                                    ];
                    
                                    foreach (string connectionId in connectionsOfGroup) {
                                        await Groups.AddToGroupAsync(
                                            connectionId,
                                            "subscribersToCommentsThatHaveRepliersWithUnknownUsernames"
                                        );
                                    }
                                }

                                await Clients.Group("subscribersToCommentsThatHaveRepliersWithUnknownUsernames").SendAsync(
                                    "UsernameFetchingError",
                                    resultOfGettingUsernamesForListOfUserIdsErrorOutput.Item1 + 
                                    @"in the non-empty list of updated-repliers(whose usernames have not been fetched yet)
                                    of the comment whose reply-updates you are subscribed to"
                                );

                                foreach (int commentId in commentIdsThatHaveRepliersWithUnknownUsernames) {
                                    HashSet<string> connectionsOfGroup = _groupsAndTheirConnections[
                                        "subscribersToReplyUpdatesOfComment"+commentId
                                    ];
                    
                                    foreach (string connectionId in connectionsOfGroup) {
                                        await Groups.RemoveFromGroupAsync(
                                            connectionId,
                                            "subscribersToCommentsThatHaveRepliersWithUnknownUsernames"
                                        );
                                    }
                                }
                            }
                            else if (resultOfGettingUsernamesForListOfUserIds is List<Dictionary<int, string>> usernameForEachUserId)
                            {
                                foreach (Dictionary<string, object> commentReplyUpdate in commentReplyUpdates) {
                                    int parentCommentId = (int) commentReplyUpdate["parentCommentId"];
                                    int commenterId = (int) commentReplyUpdate["authorId"];
                                    string comment = (string) commentReplyUpdate["content"];

                                    if (setOfUserIdsToGetUsernamesOf.Contains(commenterId) && usernameForEachUserId.Contains(commenterId)) {
                                        if (!(commentIdsAndTheirUpdatedReplies.Contains(parentCommentId))) {
                                            commentIdsAndTheirUpdatedReplies[parentCommentId] = new List<Dictionary<string, object>>();
                                        }
                        
                                        commentIdsAndTheirUpdatedReplies[parentCommentId].Add(new Dictionary<string, object> {
                                            {"commenterId", commenterId}
                                            {"comment", comment}
                                        }); 
                                    }
                                }
                                
                                foreach (int userId in usernameForEachUserId.Keys) {
                                    _userIdsAndTheirUsernames[userId] = usernameForEachUserId[userId];
                                }
                            }
                        }

                        foreach(int commentId of commentIdsAndTheirUpdatedReplies.Keys) {
                            List<Dictionary<string, object> updatedRepliesOfComment = commentIdsAndTheirUpdatedReplies[commentId];
                            List<Dictionary<string, string> repliesOfCommentWithUsernameInsteadOfCommenterId = new
                            List<Dictionary<string, string>();

                            foreach(int updatedReplyOfComment in updatedRepliesOfComment)
                            {
                                string commenter = _userIdsAndTheirUsernames[updatedReplierOfComment["commenterId"]];
                                string comment = updatedReplierOfComment["comment"];

                                repliesOfCommentWithUsernameInsteadOfCommenterId.Add(new Dictionary<string, string> {
                                    { "commenter", commenter },
                                    { "comment", comment }
                                });
                            }

                            await Clients.Group("subscribersToReplyUpdatesOfComment"+commentId).SendAsync(
                                "UpdatedRepliesOfComment",
                                repliesOfCommentWithUsernameInsteadOfCommenterId
                            );
                        }
                    }
                    
                    isCurrentlyFetchingCommentReplyUpdates = false;
                }
            }, token);
        }

        await base.OnConnectedAsync();
    }


    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connectionId = Context.ConnectionId;

        HashSet<int> commentIdsOfUser = _usersAndTheirSetOfCommentIds[userId];

        HashSet<int> commentIdsOfUser = _usersAndTheirSetOfCommentIds[userId];

        commentIdsWhoseLikesAreMonitored = commentIdsWhoseLikesAreMonitored
            .Where(commentId => !commentIdsOfUser.Contains(commentId))
            .ToList();

        if (commentIdsWhoseLikesAreMonitored.Count == 0)
        {
            ctsForFetchingCommentLikeUpdates.Cancel();
            ctsForFetchingCommentLikeUpdates.Dispose();
            ctsForFetchingCommentLikeUpdates = null;
            datetimeForCheckingUpdatesOfCommentLikes = null;
        }

        foreach (int commentId in commentIdsOfUser)
        {
            int numSubscribersToReplyUpdatesOfThisComment = _groupsAndTheirConnections["subscribersToReplyUpdatesOfComment"+commentId].Count;

            numSubscribersToReplyUpdatesOfThisComment--;

            if (numSubscribersToReplyUpdatesOfThisComment==0)
            {
                _groupsAndTheirConnections.Remove("subscribersToReplyUpdatesOfComment"+commentId);
            }
            else
            {
                _groupsAndTheirConnections["subscribersToReplyUpdatesOfComment"+commentId].Remove(connectionId);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

}
