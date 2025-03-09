using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Services;
using aspNetCoreBackend1.Models.SqlServer.Caption;

using System.Text.Json;
using System.Text;

using Microsoft.EntityFrameworkCore;
using MongoDB.Bson;

namespace aspNetCoreBackend1.graphql.Queries;


public class CaptionQueryProvider
{
    

    [UseProjection]
    [UseFiltering]
    public async Task<UnencryptedCaptionOfPost> GetCaptionOfPost(
        int? authUserId, string overallPostId,
        [Service] SqlServerContext sqlServerContext, [Service] IHttpContextAccessor httpContextAccessor,
        [Service] UserAuthService userAuthService, [Service] IHttpClientFactory httpClientFactory,
        [Service] PostgresContext postgresContext, [Service] EncryptionAndDecryptionService encryptionAndDecryptionService,
        [Service] PostInfoFetchingService postInfoFetchingService
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

        HttpClient httpClientWithMutualTLS = httpClientFactory.CreateClient("HttpClientWithMutualTLS");
        bool isEncrypted = false;
        
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
        else if (authorsAndPostEncryptionStatusIfUserHasAccessToPost is bool
        authorsAndPostEncryptionStatusIfUserHasAccessToPostSuccessOutput)
        {
            isEncrypted = authorsAndPostEncryptionStatusIfUserHasAccessToPostSuccessOutput;
        }

        UnencryptedCaptionOfPost? unencryptedCaptionOfPost = new UnencryptedCaptionOfPost();

        if (isEncrypted)
        {
            try
            {
                EncryptedCaptionOfPost? encryptedCaptionOfPost = await sqlServerContext.
                    encryptedCaptionsOfPosts
                    .Where(x => x.overallPostId == overallPostId)
                    .FirstOrDefaultAsync();
                
                if (encryptedCaptionOfPost != null)
                {
                    unencryptedCaptionOfPost.isEdited = encryptedCaptionOfPost.isEdited;
                    unencryptedCaptionOfPost.datetimeOfCaption = encryptedCaptionOfPost.datetimeOfCaption;

                    byte[]? encryptedDataEncryptionKey = postgresContext
                        .captionsCommentsAndLikesEncryptionInfo
                        .Where(x => x.overallPostId == overallPostId)
                        .Select(x => x.encryptedDataEncryptionKey)
                        .FirstOrDefault();

                    byte[] plaintextDataEncryptionKey = await encryptionAndDecryptionService
                    .DecryptEncryptedDataEncryptionKey(
                        encryptedDataEncryptionKey!,
                        $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                    );

                    string captionAuthorIdAsString = encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                        encryptedCaptionOfPost.encryptedAuthorId,
                        plaintextDataEncryptionKey,
                        encryptedCaptionOfPost.encryptionIv,
                        encryptedCaptionOfPost.encryptionAuthTag
                    );

                    unencryptedCaptionOfPost.authorId = int.Parse(captionAuthorIdAsString);

                    unencryptedCaptionOfPost.content = encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                        encryptedCaptionOfPost.encryptedContent,
                        plaintextDataEncryptionKey,
                        encryptedCaptionOfPost.encryptionIv,
                        encryptedCaptionOfPost.encryptionAuthTag
                    );
                }
                else
                {
                    unencryptedCaptionOfPost = null!;
                }
            }
            catch
            {
                throw new GraphQLException(new Error(
                    "There was trouble in the process of getting the encrypted caption and decrypting it.",
                    "INTERNAL_SERVER_ERROR"
                )); 
            }

        }
        else
        {
            try
            {
                unencryptedCaptionOfPost = await sqlServerContext.
                    unencryptedCaptionsOfPosts
                    .Where(x => x.overallPostId == overallPostId)
                    .FirstOrDefaultAsync();
            }
            catch
            {
                throw new GraphQLException(new Error(
                    "There was trouble fetching the caption of this post",
                    "INTERNAL_SERVER_ERROR"
                )); 
            }
        }

        return unencryptedCaptionOfPost!;
    }

}