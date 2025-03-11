using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Services;
using aspNetCoreBackend1.Models.SqlServer.Caption;

using System.Text.Json;

using Microsoft.EntityFrameworkCore;
using MongoDB.Bson;
using StackExchange.Redis;
using Microsoft.AspNetCore.RateLimiting;


namespace aspNetCoreBackend1.graphql.Queries;


public class CaptionQueryProvider
{
    

    [UseProjection]
    [UseFiltering]
    [EnableRateLimiting("5PerMinute")]
    public async Task<UnencryptedCaptionOfPost?> GetCaptionOfPost(
        int? authUserId, string overallPostId,
        [Service] SqlServerContext sqlServerContext, [Service] IHttpContextAccessor httpContextAccessor,
        [Service] UserAuthService userAuthService, [Service] IHttpClientFactory httpClientFactory,
        [Service] PostgresContext postgresContext, [Service] EncryptionAndDecryptionService encryptionAndDecryptionService,
        [Service] PostInfoFetchingService postInfoFetchingService, [Service] IConnectionMultiplexer redisClient
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

        Dictionary<string, object>? captionInfo = new Dictionary<string, object>();
        bool redisCachedCaptionHasBeenFetchedSuccessfully = true;
        IDatabase? redisCachingDatabase = null;
        UnencryptedCaptionOfPost? unencryptedCaptionOfPost = new UnencryptedCaptionOfPost();

        try
        {
            redisCachingDatabase =  redisClient.GetDatabase(0);
            string? stringifiedCaptionInfo = await redisCachingDatabase.HashGetAsync(
                "Posts and their Captions",
                overallPostId
            );
            if (stringifiedCaptionInfo != null)
            {
                if (stringifiedCaptionInfo == "N/A")
                {
                    unencryptedCaptionOfPost = null;
                }
                else
                {
                    captionInfo = JsonSerializer.Deserialize<Dictionary<string, object>>(
                        stringifiedCaptionInfo
                    );
                    if (!isEncrypted)
                    {
                        unencryptedCaptionOfPost = new UnencryptedCaptionOfPost(
                            overallPostId,
                            (bool) captionInfo!["isEdited"],
                            (DateTime) captionInfo!["datetimeOfCaption"],
                            (int) captionInfo!["authorId"],
                            (string) captionInfo!["content"]
                        );
                    }
                }
            }
            else
            {
                redisCachedCaptionHasBeenFetchedSuccessfully = false;
            }
        }
        catch
        {
            redisCachedCaptionHasBeenFetchedSuccessfully = false;
        }


        if (!redisCachedCaptionHasBeenFetchedSuccessfully && isEncrypted)
        {
            try
            {
                EncryptedCaptionOfPost? encryptedCaptionOfPost = await sqlServerContext.
                    encryptedCaptionsOfPosts
                    .Where(x => x.overallPostId == overallPostId)
                    .FirstOrDefaultAsync();
                
                if (encryptedCaptionOfPost != null)
                {
                    captionInfo!["overallPostId"] = encryptedCaptionOfPost!.overallPostId;
                    captionInfo!["isEdited"] = encryptedCaptionOfPost!.isEdited;
                    captionInfo!["datetimeOfCaption"] = encryptedCaptionOfPost!.datetimeOfCaption;
                    captionInfo!["encryptedAuthorId"] = encryptedCaptionOfPost!.encryptedAuthorId;
                    captionInfo!["encryptedContent"] = encryptedCaptionOfPost!.encryptedContent;
                    captionInfo!["encryptionIv"] = encryptedCaptionOfPost!.encryptionIv;
                    captionInfo!["encryptionAuthTag"] = encryptedCaptionOfPost!.encryptionAuthTag;

                    try
                    {
                        await redisCachingDatabase!.HashSetAsync(
                            "Posts and their Captions",
                            overallPostId,
                            JsonSerializer.Serialize(captionInfo)
                        );
                    }
                    catch
                    {
                        //pass
                    }
                }
                else
                {
                    unencryptedCaptionOfPost = null;

                    try
                    {
                        await redisCachingDatabase!.HashSetAsync(
                            "Posts and their Captions",
                            overallPostId,
                            "N/A"
                        );
                    }
                    catch
                    {
                        //pass
                    }
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
        else if (!redisCachedCaptionHasBeenFetchedSuccessfully)
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

            if (unencryptedCaptionOfPost != null)
            {
                try
                {
                    await redisCachingDatabase!.HashSetAsync(
                        "Posts and their Captions",
                        overallPostId,
                        JsonSerializer.Serialize(unencryptedCaptionOfPost)
                    );
                }
                catch
                {
                    //pass
                }
            }
            else
            {
                try
                {
                    await redisCachingDatabase!.HashSetAsync(
                        "Posts and their Captions",
                        overallPostId,
                        "N/A"
                    );
                }
                catch
                {
                    //pass
                }
            }
        }

        if (isEncrypted)
        {
            unencryptedCaptionOfPost!.overallPostId = overallPostId;
            unencryptedCaptionOfPost!.isEdited = (bool) captionInfo!["isEdited"];
            unencryptedCaptionOfPost!.datetimeOfCaption = (DateTime) captionInfo["datetimeOfCaption"];

            byte[] plaintextDataEncryptionKey = await encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
            (
                overallPostId!,
                postgresContext,
                encryptionAndDecryptionService,
                redisCachingDatabase!
            );

            string captionAuthorIdAsString = encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                (byte[]) captionInfo["encryptedAuthorId"],
                plaintextDataEncryptionKey,
                (byte[]) captionInfo["encryptionIv"],
                (byte[]) captionInfo["encryptionAuthTag"]
            );

            unencryptedCaptionOfPost.authorId = int.Parse(captionAuthorIdAsString);

            unencryptedCaptionOfPost.content = encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                (byte[]) captionInfo["encryptedContent"],
                plaintextDataEncryptionKey,
                (byte[]) captionInfo["encryptionIv"],
                (byte[]) captionInfo["encryptionAuthTag"]
            );
        }

        return unencryptedCaptionOfPost;
    }

}