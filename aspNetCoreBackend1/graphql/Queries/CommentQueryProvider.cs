using aspNetCoreBackend1.Services;
using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Models.SqlServer.Comment;
using aspNetCoreBackend1.graphql.Types;

using System.Text.Json;
using System.Text;

using MongoDB.Bson;
using Microsoft.EntityFrameworkCore;

namespace aspNetCoreBackend1.graphql.Queries;


public class CommentQueryProvider
{


    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public async Task<List<CommentWithNumLikesAndNumReplies>> GetBatchOfCommentsOfPost(
        int? authUserId, string overallPostId, int[] commentIdsToExclude,
        [Service] IHttpContextAccessor httpContextAccessor, [Service] UserAuthService userAuthService,
        [Service] IHttpClientFactory httpClientFactory, [Service] SqlServerContext sqlServerContext,
        [Service] PostgresContext postgresContext, [Service] EncryptionAndDecryptionService encryptionAndDecryptionService,
        [Service] CommentsService commentsService, [Service] PostInfoFetchingService postInfoFetchingService
    )
    {
        if (!ObjectId.TryParse(overallPostId, out _))
        {
            throw new GraphQLException(new Error("The provided overallPostId is invalid.", "INVALID_INPUT"));
        }

        if (authUserId < 1)
        {
            throw new GraphQLException(new Error(
                @"There does not exist a user with an id less than 1.",
                "INVALID_INPUT")
            );
        }

        HttpClient httpClient = httpClientFactory.CreateClient();
        HttpClient httpClientWithMutualTLS = httpClientFactory.CreateClient("HttpClientWithMutualTLS");

        var requestCookies = httpContextAccessor.HttpContext?.Request.Cookies;
        if (authUserId != null)
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

        List<UnencryptedCommentOfPost> unencryptedCommentsOfPost = new List<UnencryptedCommentOfPost>();
        HashSet<int> setOfCommentIdsToExclude = new HashSet<int>(
            commentIdsToExclude.Where(x => x > 0).ToArray()
        );

        if (isEncrypted)
        {
            if (authUserId == null)
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
                byte[]? encryptedDataEncryptionKey = await postgresContext
                    .captionsCommentsAndLikesEncryptionInfo
                    .Where(x => x.overallPostId == overallPostId)
                    .Select(x => x.encryptedDataEncryptionKey)
                    .FirstOrDefaultAsync();

                byte[] plaintextDataEncryptionKey = await encryptionAndDecryptionService
                .DecryptEncryptedDataEncryptionKey(
                    encryptedDataEncryptionKey!,
                    $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
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
                        encryptedCommentOfPost.encryptionIv,
                        encryptedCommentOfPost.encryptionAuthTag
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
                        encryptedCommentOfPost.encryptionIv,
                        encryptedCommentOfPost.encryptionAuthTag
                    );

                    unencryptedCommentsOfPost.Add(new UnencryptedCommentOfPost(
                        overallPostId,
                        encryptedCommentOfPost.parentCommentId,
                        encryptedCommentOfPost.isEdited,
                        encryptedCommentOfPost.datetimeOfComment,
                        authorId,
                        decryptedCommentContent
                    ));
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
            if (authUserId != null)
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
                unencryptedCommentsOfPost = await sqlServerContext.
                    unencryptedCommentsOfPosts
                    .Where(x => x.overallPostId == overallPostId && !setOfCommentIdsToExclude.Contains(x.id)
                    && !setOfAuthUserBlockings.Contains(x.authorId))
                    .ToListAsync();
            } 
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble fetching the batch of comments of this post",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }


        List<CommentWithNumLikesAndNumReplies> unencryptedBatchOfCommentsWithNumLikesAndReplies = new List
        <CommentWithNumLikesAndNumReplies>();

        try
        {
            unencryptedBatchOfCommentsWithNumLikesAndReplies =
            commentsService.SortAndFilterOutCommentsForBatch(
                authUserId, 10, authorsOfPost, setOfAuthUserFollowings, isEncrypted,
                postgresContext, sqlServerContext, unencryptedCommentsOfPost
            );
        }
        catch
        {
            throw new GraphQLException(new Error(
                @"There was trouble sorting and filtering out the all the comments of this post to form the batch",
                "INTERNAL_SERVER_ERROR"
            ));
        }

        return unencryptedBatchOfCommentsWithNumLikesAndReplies;
    }


    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public async Task<List<CommentWithNumLikesAndNumReplies>> GetBatchOfRepliesOfComment(
        int? authUserId, int commentId, int[] replyIdsToExclude,
        [Service] IHttpContextAccessor httpContextAccessor, [Service] UserAuthService userAuthService,
        [Service] IHttpClientFactory httpClientFactory, [Service] SqlServerContext sqlServerContext,
        [Service] PostgresContext postgresContext, [Service] EncryptionAndDecryptionService encryptionAndDecryptionService,
        [Service] CommentsService commentsService, [Service] PostInfoFetchingService postInfoFetchingService
    )
    {
        if (commentId < 1)
        {
            throw new GraphQLException(new Error("The provided commentId is invalid.", "INVALID_INPUT"));
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
        if (authUserId != null)
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

        List<UnencryptedCommentOfPost> unencryptedRepliesOfComment = new List<UnencryptedCommentOfPost>();
        HashSet<int> setOfReplyIdsToExclude = new HashSet<int>(
            replyIdsToExclude.Where(x => x > 0).ToArray()
        );

        if (isEncrypted==true)
        {
            if (authUserId == null)
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
                byte[]? encryptedDataEncryptionKey = await postgresContext
                    .captionsCommentsAndLikesEncryptionInfo
                    .Where(x => x.overallPostId == overallPostId)
                    .Select(x => x.encryptedDataEncryptionKey)
                    .FirstOrDefaultAsync();

                byte[] plaintextDataEncryptionKey = await encryptionAndDecryptionService
                .DecryptEncryptedDataEncryptionKey(
                    encryptedDataEncryptionKey!,
                    $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
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
                        encryptedReplyOfComment.encryptionIv,
                        encryptedReplyOfComment.encryptionAuthTag
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
                        encryptedReplyOfComment.encryptionIv,
                        encryptedReplyOfComment.encryptionAuthTag
                    );

                    unencryptedRepliesOfComment.Add(new UnencryptedCommentOfPost(
                        overallPostId!,
                        encryptedReplyOfComment.parentCommentId,
                        encryptedReplyOfComment.isEdited,
                        encryptedReplyOfComment.datetimeOfComment,
                        authorId,
                        decryptedCommentContent
                    ));
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
            if (authUserId != null)
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
                        @"You are trying to access the data of a post that doesn't exist.",
                        "NOT_FOUND"
                    ));  
                }
            } 

            try
            {
                unencryptedRepliesOfComment = await sqlServerContext.
                    unencryptedCommentsOfPosts
                    .Where(x => x.parentCommentId == commentId && !setOfReplyIdsToExclude.Contains(x.id)
                    && !setOfAuthUserBlockings.Contains(x.authorId))
                    .ToListAsync();
            } 
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble fetching the batch of replies of this comment",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }

         List<CommentWithNumLikesAndNumReplies> unencryptedBatchOfRepliesWithNumLikesAndReplies = new List
        <CommentWithNumLikesAndNumReplies>();

        try
        {
            unencryptedBatchOfRepliesWithNumLikesAndReplies = commentsService.SortAndFilterOutCommentsForBatch(
                authUserId, 10, authorsOfPost!, setOfAuthUserFollowings, (bool) isEncrypted,
                postgresContext, sqlServerContext, unencryptedRepliesOfComment
            );
        }
        catch
        {
            throw new GraphQLException(new Error(
                @"There was trouble sorting and filtering out the all the replies of this comment to form the batch",
                "INTERNAL_SERVER_ERROR"
            ));
        }

        return unencryptedBatchOfRepliesWithNumLikesAndReplies;
    }
}