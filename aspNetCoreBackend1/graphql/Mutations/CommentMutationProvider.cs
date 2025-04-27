using aspNetCoreBackend1.Services;
using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Models.SqlServer.Comment;
using aspNetCoreBackend1.graphql.Types;

using MongoDB.Bson;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using Microsoft.AspNetCore.RateLimiting;

namespace aspNetCoreBackend1.graphql.Mutations;


public class CommentMutationProvider
{


    [EnableRateLimiting("8PerMinute")]
    public async Task<int> AddCommentToPost(
        int authUserId, string overallPostId, string commentContent,
        [Service] IHttpContextAccessor httpContextAccessor, [Service] UserAuthService userAuthService,
        [Service] IHttpClientFactory httpClientFactory, [Service] SqlServerContext sqlServerContext,
        [Service] PostgresContext postgresContext, [Service] EncryptionAndDecryptionService
        encryptionAndDecryptionService, [Service] PostInfoFetchingService postInfoFetchingService,
        [Service] IConnectionMultiplexer redisClient
    )
    {
        if (authUserId < 1)
        {
            throw new GraphQLException(new Error(
                @"There does not exist a user with an id less than 1.",
                "INVALID_INPUT")
            );
        }

        if (!ObjectId.TryParse(overallPostId, out _))
        {
            throw new GraphQLException(new Error("The provided overallPostId is invalid.", "INVALID_INPUT"));
        }

        if (commentContent.Length > 2200)
        {
            throw new GraphQLException(new Error(
                "The comment may not exceed 2,200 characters in length",
                "INVALID_INPUT"
            ));
        }

        HttpClient httpClient = httpClientFactory.CreateClient();

        var requestCookies = httpContextAccessor.HttpContext?.Request.Cookies;
        var userAuthenticationResult = await userAuthService.AuthenticateUser(
            authUserId, requestCookies!, httpClient
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

        HttpClient httpClientWithMutualTLS = httpClientFactory.CreateClient("HttpClientWithMutualTLS");
        bool isEncrypted = false;

        var encryptionStatusOfPostIfAuthUserHasAccess = await postInfoFetchingService
        .getPostEncryptionStatusIfUserHasAccessToPost(
            authUserId,
            overallPostId,
            httpClientWithMutualTLS
        );
        if (encryptionStatusOfPostIfAuthUserHasAccess is Tuple<string, string> encryptionStatusOfPostIfAuthUserHasAccessErrorOutput)
        {
            throw new GraphQLException(new Error(
                encryptionStatusOfPostIfAuthUserHasAccessErrorOutput.Item1,
                encryptionStatusOfPostIfAuthUserHasAccessErrorOutput.Item2
            ));
        }
        else if (encryptionStatusOfPostIfAuthUserHasAccess is bool encryptionStatusOfPostIfAuthUserHasAccessSuccessOutput)
        {
            isEncrypted = encryptionStatusOfPostIfAuthUserHasAccessSuccessOutput;
        }
        
        int idOfNewComment = -1;

        if (isEncrypted)
        {   
            try
            {
                byte[] plaintextDataEncryptionKey = await encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                (
                    overallPostId!,
                    postgresContext,
                    encryptionAndDecryptionService,
                    redisClient.GetDatabase(0)
                );

                var encryptedAuthUserIdInfo = encryptionAndDecryptionService.EncryptTextWithAzureDataEncryptionKey(
                    authUserId.ToString(),
                    plaintextDataEncryptionKey
                );

                var encryptedCommentContentInfo = encryptionAndDecryptionService.EncryptTextWithAzureDataEncryptionKey(
                    commentContent,
                    plaintextDataEncryptionKey
                );

                EncryptedCommentOfPost newEncryptedCommentOfPost = new EncryptedCommentOfPost(
                    overallPostId,
                    null,
                    false,
                    DateTime.Now,
                    encryptedAuthUserIdInfo.encryptedTextBuffer,
                    encryptedAuthUserIdInfo.iv,
                    encryptedAuthUserIdInfo.authTag
                    encryptedCommentContentInfo.encryptedTextBuffer,
                    encryptedCommentContentInfo.iv,
                    encryptedCommentContentInfo.authTag
                );

                await sqlServerContext.encryptedCommentsOfPosts
                    .AddAsync(newEncryptedCommentOfPost);
                
                idOfNewComment = newEncryptedCommentOfPost.id;
            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble in the process of adding your encrypted comment to this post.",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }
        else
        {
            try
            {
                UnencryptedCommentOfPost newUnencryptedCommentOfPost = new UnencryptedCommentOfPost(
                    overallPostId,
                    null,
                    false,
                    DateTime.Now,
                    authUserId,
                    commentContent
                );

                await sqlServerContext.unencryptedCommentsOfPosts
                    .AddAsync(newUnencryptedCommentOfPost);
                
                idOfNewComment = newUnencryptedCommentOfPost.id;
            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble adding your comment to this post.",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }

        return idOfNewComment;
    }


    [EnableRateLimiting("8PerMinute")]
    public async Task<int> AddReplyToComment(
        int authUserId, int commentId, string replyContent,
        [Service] IHttpContextAccessor httpContextAccessor, [Service] UserAuthService userAuthService,
        [Service] IHttpClientFactory httpClientFactory, [Service] SqlServerContext sqlServerContext,
        [Service] PostgresContext postgresContext, [Service] EncryptionAndDecryptionService
        encryptionAndDecryptionService, [Service] PostInfoFetchingService postInfoFetchingService,
        [Service] IConnectionMultiplexer redisClient
    )
    {
        if (commentId < 1)
        {
            throw new GraphQLException(new Error("The provided commentId is invalid", "INVALID_INPUT"));
        }

        if (authUserId < 1)
        {
            throw new GraphQLException(new Error(
                @"There does not exist a user with an id less than 1.",
                "INVALID_INPUT")
            );
        }

        if (replyContent.Length > 2200)
        {
            throw new GraphQLException(new Error(
                "The reply may not exceed 2,200 characters in length",
                "INVALID_INPUT"
            ));
        }

        HttpClient httpClient = httpClientFactory.CreateClient();

        var requestCookies = httpContextAccessor.HttpContext?.Request.Cookies;
        var userAuthenticationResult = await userAuthService.AuthenticateUser(
            authUserId, requestCookies!, httpClient
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
                        "You are trying to add a reply to a comment that does not exist",
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
       
        var authorsAndPostEncryptionStatusIfUserHasAccessToPost = await postInfoFetchingService
        .getPostEncryptionStatusIfUserHasAccessToPost(
            authUserId,
            overallPostId,
            httpClientWithMutualTLS
        );
        if (authorsAndPostEncryptionStatusIfUserHasAccessToPost is Tuple<string, string>
        authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput)
        {
            throw new GraphQLException(new Error(
                authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput.Item1,
                authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput.Item2
            ));
        }

        int idOfNewReply = -1;
        if (isEncrypted == true)
        {   
            try
            {
                IDatabase redisCachingDatabase = redisClient.GetDatabase(0);
                byte[] plaintextDataEncryptionKey = await encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                (
                    overallPostId!,
                    postgresContext,
                    encryptionAndDecryptionService,
                    redisCachingDatabase
                );

                var encryptedAuthUserIdInfo = encryptionAndDecryptionService.EncryptTextWithAzureDataEncryptionKey(
                    authUserId.ToString(),
                    plaintextDataEncryptionKey
                );

                byte[] encryptedReplyContent = encryptionAndDecryptionService
                .EncryptTextWithAzureDataEncryptionKeyGivenIvAndAuthTag(
                    replyContent,
                    plaintextDataEncryptionKey,
                    encryptedAuthUserIdInfo.iv,
                    encryptedAuthUserIdInfo.authTag
                );

                EncryptedCommentOfPost newEncryptedReplyOfComment = new EncryptedCommentOfPost(
                    overallPostId,
                    commentId,
                    false,
                    DateTime.Now,
                    encryptedAuthUserIdInfo.encryptedTextBuffer,
                    encryptedReplyContent,
                    encryptedAuthUserIdInfo.iv,
                    encryptedAuthUserIdInfo.authTag
                );

                await sqlServerContext.encryptedCommentsOfPosts
                    .AddAsync(newEncryptedReplyOfComment);

                idOfNewReply = newEncryptedReplyOfComment.id;
            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble in the process of adding your encrypted reply to this comment.",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }
        else
        {
            try
            {
                UnencryptedCommentOfPost newUnencryptedReplyOfComment = new UnencryptedCommentOfPost(
                    overallPostId,
                    commentId,
                    false,
                    DateTime.Now,
                    authUserId,
                    replyContent
                );

                await sqlServerContext.unencryptedCommentsOfPosts
                    .AddAsync(newUnencryptedReplyOfComment);
                
                idOfNewReply = newUnencryptedReplyOfComment.id;
            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble adding your reply to this comment.",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }

        return idOfNewReply;
    }

    [EnableRateLimiting("8PerMinute")]
    public async Task<bool> EditComment(
        int authUserId, int commentId, string newCommentContent,
        [Service] IHttpContextAccessor httpContextAccessor, [Service] UserAuthService userAuthService,
        [Service] IHttpClientFactory httpClientFactory, [Service] SqlServerContext sqlServerContext,
        [Service] PostgresContext postgresContext, [Service] EncryptionAndDecryptionService
        encryptionAndDecryptionService, [Service] PostInfoFetchingService postInfoFetchingService,
        [Service] IConnectionMultiplexer redisClient
    )
    {
        if (commentId < 1)
        {
            throw new GraphQLException(new Error("The provided commentId is invalid", "INVALID_INPUT"));
        }

        if (authUserId < 1)
        {
            throw new GraphQLException(new Error(
                @"There does not exist a user with an id less than 1.",
                "INVALID_INPUT")
            );
        }

        if (newCommentContent.Length > 2200)
        {
            throw new GraphQLException(new Error(
                "The updated comment may not exceed 2,200 characters in length",
                "INVALID_INPUT"
            ));
        }

        HttpClient httpClient = httpClientFactory.CreateClient();

        var requestCookies = httpContextAccessor.HttpContext?.Request.Cookies;
        var userAuthenticationResult = await userAuthService.AuthenticateUser(
            authUserId, requestCookies!, httpClient
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

        bool? isEncrypted = null;
        string? overallPostId = null;
        try
        {
            var relevantInfoOnUnencryptedCommentToDelete = await sqlServerContext
                .unencryptedCommentsOfPosts
                .Where(x => x.id == commentId)
                .Select(x => new { x.overallPostId, x.authorId })
                .FirstOrDefaultAsync();
            
            if (relevantInfoOnUnencryptedCommentToDelete == null)
            {
                var relevantInfoOnEncryptedCommentToDelete = await sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => x.id == commentId)
                    .Select(x => new { x.overallPostId, x.encryptedAuthorId, x.encryptionIv, x.encryptionAuthTag })
                    .FirstOrDefaultAsync();

                if (relevantInfoOnEncryptedCommentToDelete == null)
                {
                    throw new GraphQLException(new Error(
                        "You are trying to edit a comment that does not exist",
                        "NOT_FOUND"
                    ));
                }

                overallPostId = relevantInfoOnEncryptedCommentToDelete.overallPostId;
                isEncrypted = true;
            }
            else
            {
                if (relevantInfoOnUnencryptedCommentToDelete.authorId != authUserId)
                {
                    throw new GraphQLException(new Error(
                        "You are trying to edit a comment that isn't yours",
                        "UNAUTHORIZED"
                    ));
                }
                overallPostId = relevantInfoOnUnencryptedCommentToDelete.overallPostId;
                isEncrypted = false;
            }
        }
        catch
        {
            throw new GraphQLException(new Error(
                @"There was trouble in the process of getting the encryption-status and overallPostId of the
                comment, as well as the author of the comment(if the comment even exists), you are trying to delete.",
                "INTERNAL_SERVER_ERROR"
            ));
        }

        HttpClient httpClientWithMutualTLS = httpClientFactory.CreateClient("HttpClientWithMutualTLS");
        var authorsAndPostEncryptionStatusIfUserHasAccessToPost = await postInfoFetchingService
        .getPostEncryptionStatusIfUserHasAccessToPost(
            authUserId,
            overallPostId,
            httpClientWithMutualTLS
        );
        if (authorsAndPostEncryptionStatusIfUserHasAccessToPost is Tuple<string, string>
        authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput)
        {
            throw new GraphQLException(new Error(
                authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput.Item1,
                authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput.Item2
            ));
        }

        if (isEncrypted == true)
        {
            try
            {
                EncryptedCommentOfPost? encryptedCommentToEdit = await sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => x.id == commentId)
                    .FirstOrDefaultAsync();
                
                IDatabase redisCachingDatabase = redisClient.GetDatabase(0);
                byte[] plaintextDataEncryptionKey = await encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                (
                    overallPostId!,
                    postgresContext,
                    encryptionAndDecryptionService,
                    redisCachingDatabase
                );

                encryptedCommentToEdit!.isEdited = true;
                encryptedCommentToEdit!.encryptedContent = encryptionAndDecryptionService
                .EncryptTextWithAzureDataEncryptionKeyGivenIvAndAuthTag(
                    newCommentContent,
                    plaintextDataEncryptionKey,
                    encryptedCommentToEdit.encryptionIv,
                    encryptedCommentToEdit.encryptionAuthTag
                );
                encryptedCommentToEdit!.datetime = DateTime.Now;

                sqlServerContext.encryptedCommentsOfPosts.Update(encryptedCommentToEdit);
                await sqlServerContext.SaveChangesAsync();
            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble in the process of editing the encrypted comment, if it even exists, of this
                    post.",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }
        else
        {
            try
            {
                UnencryptedCommentOfPost? unencryptedCommentToEdit = await sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => x.id == commentId)
                    .FirstOrDefaultAsync();

                unencryptedCommentToEdit!.isEdited = true;
                unencryptedCommentToEdit!.content = newCommentContent;
                unencryptedCommentToEdit!.datetime = DateTime.Now;

                sqlServerContext.unencryptedCommentsOfPosts.Update(unencryptedCommentToEdit);
                await sqlServerContext.SaveChangesAsync();
            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble editing the unencrypted comment, if it even exists, of this post.",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }

        return true;
    }

    [EnableRateLimiting("8PerMinute")]
    public async Task<InfoAfterDeletingComment> DeleteComment(
        int authUserId, int commentId,
        [Service] IHttpContextAccessor httpContextAccessor, [Service] UserAuthService userAuthService,
        [Service] IHttpClientFactory httpClientFactory, [Service] SqlServerContext sqlServerContext,
        [Service] PostgresContext postgresContext, [Service] PostInfoFetchingService postInfoFetchingService
    )
    {
        if (commentId < 1)
        {
            throw new GraphQLException(new Error("The provided commentId is invalid", "INVALID_INPUT"));
        }

        if (authUserId < 1)
        {
            throw new GraphQLException(new Error(
                @"There does not exist a user with an id less than 1.",
                "INVALID_INPUT")
            );
        }

        HttpClient httpClient = httpClientFactory.CreateClient();

        var requestCookies = httpContextAccessor.HttpContext?.Request.Cookies;
        var userAuthenticationResult = await userAuthService.AuthenticateUser(
            authUserId, requestCookies!, httpClient
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

        bool? isEncrypted = null;
        string? overallPostId = null;
        try
        {
            var relevantInfoOnUnencryptedCommentToDelete = await sqlServerContext
                .unencryptedCommentsOfPosts
                .Where(x => x.id == commentId)
                .Select(x => new { x.overallPostId, x.authorId })
                .FirstOrDefaultAsync();
            
            if (relevantInfoOnUnencryptedCommentToDelete == null)
            {
                var relevantInfoOnEncryptedCommentToDelete = await sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => x.id == commentId)
                    .Select(x => new { x.overallPostId, x.encryptedAuthorId, x.encryptionIv, x.encryptionAuthTag })
                    .FirstOrDefaultAsync();

                if (relevantInfoOnEncryptedCommentToDelete == null)
                {
                    throw new GraphQLException(new Error(
                        "You are trying to delete a comment that does not exist",
                        "NOT_FOUND"
                    ));
                }

                overallPostId = relevantInfoOnEncryptedCommentToDelete.overallPostId;
                isEncrypted = true;
            }
            else
            {
                if (relevantInfoOnUnencryptedCommentToDelete.authorId != authUserId)
                {
                    throw new GraphQLException(new Error(
                        "You are trying to delete a comment that isn't yours",
                        "UNAUTHORIZED"
                    ));
                }
                overallPostId = relevantInfoOnUnencryptedCommentToDelete.overallPostId;
                isEncrypted = false;
            }
        }
        catch
        {
            throw new GraphQLException(new Error(
                @"There was trouble in the process of getting the encryption-status and overallPostId of the
                comment, as well as the author of the comment(if the comment even exists), you are trying to delete.",
                "INTERNAL_SERVER_ERROR"
            ));
        }
        
        HttpClient httpClientWithMutualTLS = httpClientFactory.CreateClient("HttpClientWithMutualTLS");
        
        var authorsAndPostEncryptionStatusIfUserHasAccessToPost = await postInfoFetchingService
        .getPostEncryptionStatusIfUserHasAccessToPost(
            authUserId,
            overallPostId,
            httpClientWithMutualTLS
        );
        if (authorsAndPostEncryptionStatusIfUserHasAccessToPost is Tuple<string, string>
        authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput)
        {
            throw new GraphQLException(new Error(
                authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput.Item1,
                authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput.Item2
            ));
        }

        int totalNumberOfLikesOfCommentDeleted = 0;
        int totalNumberOfRepliesDeleted = 0;
        int totalNumberOfLikesOfRepliesDeleted = 0;

        if (isEncrypted == true)
        {
            try
            {
                await sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => x.id == commentId)
                    .ExecuteDeleteAsync();
            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble deleting this encrypted comment.",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }
        else
        {
            try
            {
                await sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => x.id == commentId)
                    .ExecuteDeleteAsync();
            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble deleting this unencrypted comment.",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }

        try
        {
            if (isEncrypted == true)
            {
                totalNumberOfLikesOfCommentDeleted = await postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => x.commentId == commentId)
                    .ExecuteDeleteAsync();
            }
            else
            {
                totalNumberOfLikesOfCommentDeleted = await postgresContext
                    .unencryptedPostOrCommentLikes
                    .Where(x => x.commentId == commentId)
                    .ExecuteDeleteAsync();
            }
        }
        catch
        {
            throw new GraphQLException(new Error(
                @"There was trouble removing the likes, if any, of this comment.",
                "INTERNAL_SERVER_ERROR"
            ));
        }

        HashSet<int> setOfIdsOfRepliesToDeletedComment = new HashSet<int>();
        try
        {
            if (isEncrypted == true)
            {
                setOfIdsOfRepliesToDeletedComment =  await sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => x.parentCommentId == commentId)
                    .Select(x => x.id)
                    .ToHashSetAsync();
                
                totalNumberOfRepliesDeleted = await sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => x.parentCommentId == commentId)
                    .ExecuteDeleteAsync();
            }
            else
            {
                setOfIdsOfRepliesToDeletedComment =  await sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => x.parentCommentId == commentId)
                    .Select(x => x.id)
                    .ToHashSetAsync();
                
                totalNumberOfRepliesDeleted = await sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => x.parentCommentId == commentId)
                    .ExecuteDeleteAsync();
            }
        }
        catch
        {
            throw new GraphQLException(new Error(
                @"There was trouble in the process of removing the replies, if any, of this comment.",
                "INTERNAL_SERVER_ERROR"
            ));
        }

        try
        {
            if (isEncrypted == true)
            {
                totalNumberOfLikesOfRepliesDeleted = await postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => setOfIdsOfRepliesToDeletedComment.Contains(x.commentId ?? -1))
                    .ExecuteDeleteAsync();
            }
            else
            {
                totalNumberOfLikesOfRepliesDeleted = await postgresContext
                    .unencryptedPostOrCommentLikes
                    .Where(x => setOfIdsOfRepliesToDeletedComment.Contains(x.commentId ?? -1))
                    .ExecuteDeleteAsync();
            }
        }
        catch
        {
            throw new GraphQLException(new Error(
                @"There was trouble removing the likes, if any, of the replies of this comment.",
                "INTERNAL_SERVER_ERROR"
            ));
        }

        InfoAfterDeletingComment infoAfterDeletingComment = new InfoAfterDeletingComment(
            totalNumberOfLikesOfCommentDeleted,
            totalNumberOfRepliesDeleted,
            totalNumberOfLikesOfRepliesDeleted  
        );
        return infoAfterDeletingComment;
    }
}