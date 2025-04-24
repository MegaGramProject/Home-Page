using aspNetCoreBackend1.Services;
using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Models.SqlServer.Comment;
using aspNetCoreBackend1.graphql.Types;

using MongoDB.Bson;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using Microsoft.AspNetCore.RateLimiting;


namespace aspNetCoreBackend1.graphql.Queries;


public class CommentQueryProvider
{


    [UseProjection]
    [UseFiltering]
    [UseSorting]
    [EnableRateLimiting("5PerMinute")]
    public async Task<List<Dictionary<string, object>>> GetBatchOfCommentsOfPost(
        int authUserId, string overallPostId, int?[] commentIdsToExclude, int? maxBatchSize
        [Service] IHttpContextAccessor httpContextAccessor, [Service] UserAuthService userAuthService,
        [Service] IHttpClientFactory httpClientFactory, [Service] SqlServerContext sqlServerContext,
        [Service] PostgresContext postgresContext, [Service] EncryptionAndDecryptionService encryptionAndDecryptionService,
        [Service] CommentsService commentsService, [Service] PostInfoFetchingService postInfoFetchingService,
        [Service] IConnectionMultiplexer redisClient
    )
    {
        if (authUserId < 1 && authUserId !== -1)
        {
            throw new GraphQLException(new Error(
                @"There does not exist a user with an id less than 1. If you're an anonymous guest, you must set the authUserId
                to -1.",
                "INVALID_INPUT")
            );
        }

        if (!ObjectId.TryParse(overallPostId, out _))
        {
            throw new GraphQLException(new Error("The provided overallPostId is invalid.", "INVALID_INPUT"));
        }

        if (commentIdsToExclude == null) {
            commentIdsToExclude = new int[0];
        }

        if (maxBatchSize == null || maxBatchSize > 10)
        {
            maxBatchSize = 10;
        }

        HttpClient httpClient = httpClientFactory.CreateClient();
        HttpClient httpClientWithMutualTLS = httpClientFactory.CreateClient("HttpClientWithMutualTLS");

        var requestCookies = httpContextAccessor.HttpContext?.Request.Cookies;
        if (authUserId != -1)
        {
            var userAuthenticationResult = await userAuthService.AuthenticateUser(
                (int) authUserId, requestCookies!, httpClient
            );

            if (userAuthenticationResult is bool userAuthenticationResultAsBoolean)
            {
                if (!userAuthenticationResultAsBoolean)
                {
                    throw new GraphQLException(new Error(
                        @$"The expressJSBackend1 server could not verify you as having the proper credentials
                        to be logged in as {authUserId}",
                        "UNAUTHORIZED"
                    ));
                }
            }
            else if (userAuthenticationResult is string userAuthenticationResultAsString)
            {
                if (string.Equals(userAuthenticationResultAsString, @"The provided authUser token, if any, in your
                cookies has an invalid structure."))
                {
                    throw new GraphQLException(new Error(
                        userAuthenticationResultAsString,
                        "UNAUTHORIZED"
                    ));
                }
                throw new GraphQLException(new Error(
                    userAuthenticationResultAsString,
                    "BAD_GATEWAY"
                ));
            }
            else if (userAuthenticationResult is List<object> userAuthenticationResultAsList)
            {
                httpContextAccessor.HttpContext?.Response.Cookies.Append(
                    $"authToken{authUserId}", 
                   (string) userAuthenticationResultAsList[0],
                    new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict,
                        Expires = (DateTime) userAuthenticationResultAsList[1]
                    }
                );
            }
        }

        bool isEncrypted = false;
        int[] authorsOfPost = [];
        HashSet<int> setOfAuthUserFollowings = new HashSet<int>();
        HashSet<int> setOfAuthUserBlockings = new HashSet<int>();

        var authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUser =
        await postInfoFetchingService.getAuthorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUser(
            authUserId,
            overallPostId, 
            httpClientWithMutualTLS
        );
        if (authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUser is Tuple<string, string>
        authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserErrorOutput)
        {
            throw new GraphQLException(new Error(
                authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserErrorOutput.Item1,
                authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserErrorOutput.Item2
            ));
        }
        else if (authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUser is Dictionary<string, object>
        authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserSuccessOutput)
        {
            authorsOfPost = (int[]) authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserSuccessOutput[
                "authorsOfPost"
            ];
            isEncrypted = (bool) authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserSuccessOutput[
                "isEncrypted"
            ];
            setOfAuthUserFollowings = (HashSet<int>) 
            authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserSuccessOutput[
                "setOfAuthUserFollowings"
            ];
            setOfAuthUserBlockings = (HashSet<int>)
            authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserSuccessOutput[
                "setOfAuthUserBlockings"
            ];
        }

        Dictionary<string, List<Dictionary<string, object>>> commenterStatusesAndTheirComments =
        new Dictionary<List<Dictionary<string, object>>> {
            { "You", new List<Dictionary<string, object>>()}
            { "Following", new List<Dictionary<string, object>>()}
            { "Author", new List<Dictionary<string, object>>()}
            { "Stranger", new List<Dictionary<string, object>>()}
        };

        HashSet<int> setOfCommentIdsToExclude = new HashSet<int>(
            commentIdsToExclude.Where(x => x > 0).ToArray()
        );

        byte[] plaintextDataEncryptionKey =  null;

        if (isEncrypted)
        {
            if (authUserId == -1)
            {
                throw new GraphQLException(new Error(
                    @"As an anonymous guest, you are not authorized to view comments of this private post.",
                    "UNAUTHORIZED"
                ));  
            }

            bool userFollowsAtLeastOneAuthor = false;
            foreach(int authorId in authorsOfPost)
            {
                if (setOfAuthUserFollowings.Contains(authorId))
                {
                    userFollowsAtLeastOneAuthor = true;
                    break;
                }
            }

            if (!userFollowsAtLeastOneAuthor)
            {
                throw new GraphQLException(new Error(
                    @"As someone who doesn't follow any of the post's authors, you do not have access to any of the encrypted
                    data of this private-post.",
                    "UNAUTHORIZED"
                ));  
            }

            try
            {
                plaintextDataEncryptionKey = await encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                (
                    overallPostId!,
                    postgresContext,
                    encryptionAndDecryptionService,
                    redisClient.GetDatabase(0)
                );

                List<EncryptedCommentOfPost> encryptedCommentsOfPost = await sqlServerContext.
                    encryptedCommentsOfPosts
                    .Where(x => x.overallPostId == overallPostId && !setOfCommentIdsToExclude.Contains(x.id))
                    .ToListAsync();
                
                foreach(EncryptedCommentOfPost encryptedCommentOfPost in encryptedCommentsOfPost)
                {
                    string authorIdAsString = encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey
                    (
                        encryptedCommentOfPost.encryptedAuthorId,
                        plaintextDataEncryptionKey,
                        encryptedCommentOfPost.authorIdEncryptionIv,
                        encryptedCommentOfPost.authorIdEncryptionAuthTag
                    );
                    int authorId = int.Parse(authorIdAsString);

                    if (setOfAuthUserBlockings.Contains(authorId))
                    {
                        continue;
                    }

                    string decryptedCommentContent = encryptionAndDecryptionService
                    .DecryptTextWithAzureDataEncryptionKey
                    (
                        encryptedCommentOfPost.encryptedContent,
                        plaintextDataEncryptionKey,
                        encryptedCommentOfPost.contentEncryptionIv,
                        encryptedCommentOfPost.contentEncryptionAuthTag
                    );

                    string authorStatus = "";

                    if (authorId == authUserId) {
                        authorStatus = "You";
                    }
                    else if (setOfAuthUserFollowings.Contains(authorId)) {
                        authorStatus = "Following";
                    }
                    else if (authorsOfPost.Contains(authorId)) {
                        authorStatus = "Author";
                    }
                    else {
                        authorStatus = "Stranger";
                    }

                    commenterStatusesAndTheirComments[authorStatus].Add(new Dictionary<string, object> {
                        {"id", encryptedCommentOfPost.id},
                        {"parentCommentId", commentId},
                        {"authorId", authorId},
                        {"authorStatus", authorStatus},
                        {"isEdited", encryptedCommentOfPost.isEdited},
                        {"datetime", encryptedCommentOfPost.datetime},
                        {"content", decryptedCommentContent},
                        {"authorUsername", "user " + authorId},
                        {"isLikedByAuthUser", false},
                        {"isLikedByPostAuthor", false},
                        {"numLikes", 0},
                        {"numReplies", 0}
                    });
                }

            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble in the process of decrypting the comments of this encrypted post.",
                    "INTERNAL_SERVER_ERROR"
                ));   
            }
        }
        else
        {
            if (authUserId != -1)
            {
                bool userIsBlockedByEachPostAuthor = true;
                foreach(int authorId in authorsOfPost)
                {
                    if (!setOfAuthUserBlockings.Contains(authorId))
                    {
                        userIsBlockedByEachPostAuthor = false;
                        break;
                    }
                }

                if (userIsBlockedByEachPostAuthor)
                {
                    throw new GraphQLException(new Error(
                        @"You are trying to access the comments of a post that doesn't exist.",
                        "NOT_FOUND"
                    ));  
                }
            }

            try
            {
                List<UnencryptedCommentOfPost> unencryptedCommentsOfPost = await sqlServerContext.
                    unencryptedCommentsOfPosts
                    .Where(x => x.overallPostId == overallPostId && !setOfCommentIdsToExclude.Contains(x.id)
                    && !setOfAuthUserBlockings.Contains(x.authorId))
                    .ToListAsync();
                
                foreach(UnencryptedCommentOfPost unencryptedCommentOfPost in unencryptedCommentsOfPost)
                {
                    int authorId = unencryptedCommentOfPost.authorId;

                    if (authorId == authUserId) {
                        authorStatus = "You";
                    }
                    else if (setOfAuthUserFollowings.Contains(authorId)) {
                        authorStatus = "Following";
                    }
                    else if (authorsOfPost.Contains(authorId)) {
                        authorStatus = "Author";
                    }
                    else {
                        authorStatus = "Stranger";
                    }

                    commenterStatusesAndTheirComments[authorStatus].Add(new Dictionary<string, object> {
                        {"id", unencryptedCommentOfPost.id},
                        {"parentCommentId", commentId},
                        {"authorId", authorId},
                        {"authorStatus", authorStatus},
                        {"isEdited", unencryptedCommentOfPost.isEdited},
                        {"datetime", unencryptedCommentOfPost.datetime},
                        {"content", unencryptedCommentOfPost.content},
                        {"authorUsername", "user " + authorId},
                        {"isLikedByAuthUser", false},
                        {"isLikedByPostAuthor", false},
                        {"numLikes", 0},
                        {"numReplies", 0}
                    });
                }
            } 
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble fetching the batch of comments of this post",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }


        List<Dictionary<string, object>> batchOfRepliesWithInDepthInfo = commentsService.GetBatchOfCommentsWithInDepthInfo(
            authUserId, maxBatchSize, authorsOfPost, plaintextDataEncryptionKey, postgresContext, sqlServerContext,
            commenterStatusesAndTheirComments, encryptionAndDecryptionService
        );

        return batchOfRepliesWithInDepthInfo;
    }


    [UseProjection]
    [UseFiltering]
    [UseSorting]
    [EnableRateLimiting("5PerMinute")]
    public async Task<List<Dictionary<string, object>>> GetBatchOfRepliesOfComment(
        int authUserId, int commentId, int?[] replyIdsToExclude, int? maxBatchSize
        [Service] IHttpContextAccessor httpContextAccessor, [Service] UserAuthService userAuthService,
        [Service] IHttpClientFactory httpClientFactory, [Service] SqlServerContext sqlServerContext,
        [Service] PostgresContext postgresContext, [Service] EncryptionAndDecryptionService encryptionAndDecryptionService,
        [Service] CommentsService commentsService, [Service] PostInfoFetchingService postInfoFetchingService,
        [Service] IConnectionMultiplexer redisClient
    )
    {
        if (authUserId < 1 && authUserId !== -1)
        {
            throw new GraphQLException(new Error(
                @"There does not exist a user with an id less than 1. If you're an anonymous guest, you must set the authUserId
                to -1.",
                "INVALID_INPUT")
            );
        }

        if (commentId < 1)
        {
            throw new GraphQLException(new Error("The provided commentId is invalid.", "INVALID_INPUT"));
        }

        if (replyIdsToExclude == null) {
            replyIdsToExclude = new int[0];
        }

        if (maxBatchSize == null || maxBatchSize > 7)
        {
            maxBatchSize = 7;
        }

        HttpClient httpClient = httpClientFactory.CreateClient();

        var requestCookies = httpContextAccessor.HttpContext?.Request.Cookies;
        if (authUserId != -1)
        {
            var userAuthenticationResult = await userAuthService.AuthenticateUser(
                (int) authUserId, requestCookies!, httpClient
            );

            if (userAuthenticationResult is bool userAuthenticationResultAsBoolean)
            {
                if (!userAuthenticationResultAsBoolean)
                {
                    throw new GraphQLException(new Error(
                        @$"The expressJSBackend1 server could not verify you as having the proper credentials
                        to be logged in as {authUserId}",
                        "UNAUTHORIZED"
                    ));
                }
            }
            else if (userAuthenticationResult is string userAuthenticationResultAsString)
            {
                if (string.Equals(userAuthenticationResultAsString, @"The provided authUser token, if any, in your
                cookies has an invalid structure."))
                {
                    throw new GraphQLException(new Error(
                        userAuthenticationResultAsString,
                        "UNAUTHORIZED"
                    ));
                }
                throw new GraphQLException(new Error(
                    userAuthenticationResultAsString,
                    "BAD_GATEWAY"
                ));
            }
            else if (userAuthenticationResult is List<object> userAuthenticationResultAsList)
            {
                httpContextAccessor.HttpContext?.Response.Cookies.Append(
                    $"authToken{authUserId}", 
                   (string) userAuthenticationResultAsList[0],
                    new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict,
                        Expires = (DateTime) userAuthenticationResultAsList[1]
                    }
                );
            }
        }

        bool? isEncrypted = null;
        string? overallPostId = null;
        try
        {
            overallPostId = await sqlServerContext
                .unencryptedCommentsOfPosts
                .Where(x => x.id == commentId)
                .Select(x => x.overallPostId)
                .FirstOrDefaultAsync();
            
            if (overallPostId == null)
            {
                overallPostId = await sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => x.id == commentId)
                    .Select(x => x.overallPostId)
                    .FirstOrDefaultAsync();

                if (overallPostId == null)
                {
                    throw new GraphQLException(new Error(
                        "You are trying to view the replies of a comment that does not exist",
                        "NOT_FOUND"
                    ));
                }
                isEncrypted = true;
            }
            else
            {
                isEncrypted = false;
            }
        }
        catch
        {
            throw new GraphQLException(new Error(
                @"There was trouble in the process of getting the encryption-status and overallPostId of the
                comment, if it even exists, whose replies you are trying to fetch",
                "INTERNAL_SERVER_ERROR"
            ));
        }

        HttpClient httpClientWithMutualTLS = httpClientFactory.CreateClient("HttpClientWithMutualTLS");
        int[] authorsOfPost = [];
        HashSet<int> setOfAuthUserFollowings = new HashSet<int>();
        HashSet<int> setOfAuthUserBlockings = new HashSet<int>();

        var authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUser =
        await postInfoFetchingService.getAuthorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUser(
            authUserId,
            overallPostId, 
            httpClientWithMutualTLS
        );
        if (authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUser is Tuple<string, string>
        authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserErrorOutput)
        {
            throw new GraphQLException(new Error(
                authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserErrorOutput.Item1,
                authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserErrorOutput.Item2
            ));
        }
        else if (authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUser is Dictionary<string, object>
        authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserSuccessOutput)
        {
            authorsOfPost = (int[]) authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserSuccessOutput[
                "authorsOfPost"
            ];
            setOfAuthUserFollowings = (HashSet<int>) 
            authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserSuccessOutput[
                "setOfAuthUserFollowings"
            ];
            setOfAuthUserBlockings = (HashSet<int>)
            authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserSuccessOutput[
                "setOfAuthUserBlockings"
            ];
        }

        Dictionary<string, List<Dictionary<string, object>>> commenterStatusesAndTheirComments =
        new Dictionary<List<Dictionary<string, object>>> {
            { "You", new List<Dictionary<string, object>>()}
            { "Following", new List<Dictionary<string, object>>()}
            { "Author", new List<Dictionary<string, object>>()}
            { "Stranger", new List<Dictionary<string, object>>()}
        };

        HashSet<int> setOfReplyIdsToExclude = new HashSet<int>(
            replyIdsToExclude.Where(x => x > 0).ToArray()
        );

        byte[] plaintextDataEncryptionKey = null;

        if (isEncrypted==true)
        {
            if (authUserId == -1)
            {
               throw new GraphQLException(new Error(
                    @"As an anonymous guest, you are not authorized to view comments of this private post.",
                    "UNAUTHORIZED"
                ));  
            }

            bool userFollowsAtLeastOneAuthor = false;
            foreach(int authorId in authorsOfPost!)
            {
                if (setOfAuthUserFollowings.Contains(authorId))
                {
                    userFollowsAtLeastOneAuthor = true;
                    break;
                }
            }

            if (!userFollowsAtLeastOneAuthor)
            {
                throw new GraphQLException(new Error(
                    @"As someone who doesn't follow any of the post's authors, you do not have access to any of the encrypted
                    data of this private-post.",
                    "UNAUTHORIZED"
                ));  
            }

            try
            {
                plaintextDataEncryptionKey = await encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                (
                    overallPostId!,
                    postgresContext,
                    encryptionAndDecryptionService,
                    redisClient.GetDatabase(0)
                );

                List<EncryptedCommentOfPost> encryptedRepliesOfComment = await sqlServerContext.
                    encryptedCommentsOfPosts
                    .Where(x => x.parentCommentId == commentId && !setOfReplyIdsToExclude.Contains(x.id))
                    .ToListAsync();
                
                foreach(EncryptedCommentOfPost encryptedReplyOfComment in encryptedRepliesOfComment)
                {
                    string authorIdAsString = encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey
                    (
                        encryptedReplyOfComment.encryptedAuthorId,
                        plaintextDataEncryptionKey,
                        encryptedReplyOfComment.authorIdEncryptionIv,
                        encryptedReplyOfComment.authorIdEncryptionAuthTag
                    );
                    int authorId = int.Parse(authorIdAsString);

                    if (setOfAuthUserBlockings.Contains(authorId))
                    {
                        continue;
                    }

                    string decryptedCommentContent = encryptionAndDecryptionService
                    .DecryptTextWithAzureDataEncryptionKey
                    (
                        encryptedReplyOfComment.encryptedContent,
                        plaintextDataEncryptionKey,
                        encryptedReplyOfComment.contentEncryptionIv,
                        encryptedReplyOfComment.contentEncryptionAuthTag
                    );

                    string authorStatus = "";

                    if (authorId == authUserId) {
                        authorStatus = "You";
                    }
                    else if (setOfAuthUserFollowings.Contains(authorId)) {
                        authorStatus = "Following";
                    }
                    else if (authorsOfPost.Contains(authorId)) {
                        authorStatus = "Author";
                    }
                    else {
                        authorStatus = "Stranger";
                    }

                    commenterStatusesAndTheirComments[authorStatus].Add(new Dictionary<string, object> {
                        {"id", encryptedReplyOfComment.id},
                        {"parentCommentId", commentId},
                        {"authorId", authorId},
                        {"authorStatus", authorStatus},
                        {"isEdited", encryptedReplyOfComment.isEdited},
                        {"datetime", encryptedReplyOfComment.datetime},
                        {"content", decryptedCommentContent},
                        {"authorUsername", "user " + authorId},
                        {"isLikedByAuthUser", false},
                        {"isLikedByPostAuthor", false},
                        {"numLikes", 0},
                        {"numReplies", 0}
                    });
                }
            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble in the process of decrypting the replies of this encrypted comment.",
                    "INTERNAL_SERVER_ERROR"
                ));   
            }
        }
        else
        {
            if (authUserId != -1)
            {
                bool userIsBlockedByEachPostAuthor = true;
                foreach(int authorId in authorsOfPost!)
                {
                    if (!setOfAuthUserBlockings.Contains(authorId))
                    {
                        userIsBlockedByEachPostAuthor = false;
                        break;
                    }
                }

                if (userIsBlockedByEachPostAuthor)
                {
                    throw new GraphQLException(new Error(
                        "You are trying to view the replies of a comment that does not exist",
                        "NOT_FOUND"
                    ));
                }
            } 

            try
            {
                List<UnencryptedCommentOfPost> unencryptedRepliesOfComment = await sqlServerContext.
                    unencryptedCommentsOfPosts
                    .Where(x => x.parentCommentId == commentId && !setOfReplyIdsToExclude.Contains(x.id)
                    && !setOfAuthUserBlockings.Contains(x.authorId))
                    .ToListAsync();
                
                foreach(UnencryptedCommentOfPost unencryptedReplyOfComment in unencryptedRepliesOfComment)
                {
                    int authorId = unencryptedReplyOfComment.authorId;

                    if (authorId == authUserId) {
                        authorStatus = "You";
                    }
                    else if (setOfAuthUserFollowings.Contains(authorId)) {
                        authorStatus = "Following";
                    }
                    else if (authorsOfPost.Contains(authorId)) {
                        authorStatus = "Author";
                    }
                    else {
                        authorStatus = "Stranger";
                    }

                    commenterStatusesAndTheirComments[authorStatus].Add(new Dictionary<string, object> {
                        {"id", unencryptedReplyOfComment.id},
                        {"parentCommentId", commentId},
                        {"authorId", authorId},
                        {"authorStatus", authorStatus},
                        {"isEdited", unencryptedReplyOfComment.isEdited},
                        {"datetime", unencryptedReplyOfComment.datetime},
                        {"content", unencryptedReplyOfComment.content},
                        {"authorUsername", "user " + authorId},
                        {"isLikedByAuthUser", false},
                        {"isLikedByPostAuthor", false},
                        {"numLikes", 0},
                        {"numReplies", 0}
                    });
                }
            } 
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble fetching the batch of replies of this comment",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }

        List<Dictionary<string, object>> batchOfRepliesWithInDepthInfo = commentsService.GetBatchOfCommentsWithInDepthInfo(
            authUserId, maxBatchSize, authorsOfPost, plaintextDataEncryptionKey, postgresContext, sqlServerContext,
            commenterStatusesAndTheirComments, encryptionAndDecryptionService
        );

        return batchOfRepliesWithInDepthInfo;
    }
}