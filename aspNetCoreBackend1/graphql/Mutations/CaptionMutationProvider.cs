using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Services;

using MongoDB.Bson;
using StackExchange.Redis;
using Microsoft.AspNetCore.RateLimiting;


namespace aspNetCoreBackend1.graphql.Mutations;


public class CaptionMutationProvider
{


    [EnableRateLimiting("5PerMinute")]
    public async Task<bool> AddCaptionToPost(
        int authUserId, string overallPostId, string captionContent,
        [Service] IHttpContextAccessor httpContextAccessor, [Service] UserAuthService userAuthService,
        [Service] IHttpClientFactory httpClientFactory, [Service] SqlServerContext sqlServerContext,
        [Service] PostgresContext postgresContext, [Service] EncryptionAndDecryptionService
        encryptionAndDecryptionService, [Service] PostInfoFetchingService postInfoFetchingService,
        [Service] IConnectionMultiplexer redisClient, [Service] CaptionService captionService
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

        if (captionContent.Length > 2200)
        {
            throw new GraphQLException(new Error(
                "The caption may not exceed 2,200 characters in length",
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

        var isUserAnAuthorAndIsPostEncrypted = await postInfoFetchingService
        .checkIfUserIsAnAuthorAndAlsoGetEncryptionStatusOfPost(
            authUserId,
            overallPostId,
            httpClientWithMutualTLS
        );

        if (isUserAnAuthorAndIsPostEncrypted is Tuple<string, string> isUserAnAuthorAndIsPostEncryptedErrorOutput)
        {
            throw new GraphQLException(new Error(
                isUserAnAuthorAndIsPostEncryptedErrorOutput.Item1,
                isUserAnAuthorAndIsPostEncryptedErrorOutput.Item2
            ));
        }
        else if (isUserAnAuthorAndIsPostEncrypted is Tuple<bool, bool> isUserAnAuthorAndIsPostEncryptedSuccessOutput)
        {
            if (!isUserAnAuthorAndIsPostEncryptedSuccessOutput.Item1)
            {
                throw new GraphQLException(new Error(
                    @"You cannot add a caption to a post that you aren't an author of.",
                    "UNAUTHORIZED"
                ));
            }
            isEncrypted = isUserAnAuthorAndIsPostEncryptedSuccessOutput.Item2;
        }

        IDatabase? redisCachingDatabase = null;
        try
        {
            redisCachingDatabase = redisClient.GetDatabase(0);
        }
        catch
        {
            //pass
        }

        var addCaptionToPostResult = await captionService.AddCaptionToPost(
            authUserId, overallPostId, captionContent, isEncrypted, encryptionAndDecryptionService,
            postgresContext, redisCachingDatabase!, sqlServerContext
        );

        if (addCaptionToPostResult is Tuple<string, string> addCaptionToPostResultErrorOutput)
        {
            throw new GraphQLException(new Error(
                addCaptionToPostResultErrorOutput.Item1,
                addCaptionToPostResultErrorOutput.Item2
            ));
        }
        return true;
    }

    
    [EnableRateLimiting("5PerMinute")]
    public async Task<bool> EditCaptionOfPost(
        int authUserId, string overallPostId, string newCaptionContent,
        [Service] IHttpContextAccessor httpContextAccessor, [Service] UserAuthService userAuthService,
        [Service] IHttpClientFactory httpClientFactory, [Service] SqlServerContext sqlServerContext,
        [Service] PostgresContext postgresContext, [Service] EncryptionAndDecryptionService
        encryptionAndDecryptionService, [Service] PostInfoFetchingService postInfoFetchingService,
        [Service] IConnectionMultiplexer redisClient, [Service] CaptionService captionService

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

        if (newCaptionContent.Length > 2200)
        {
            throw new GraphQLException(new Error(
                "The updated caption may not exceed 2,200 characters in length",
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

        var isUserAnAuthorAndIsPostEncrypted = await postInfoFetchingService
        .checkIfUserIsAnAuthorAndAlsoGetEncryptionStatusOfPost(
            authUserId,
            overallPostId,
            httpClientWithMutualTLS
        );

        if (isUserAnAuthorAndIsPostEncrypted is Tuple<string, string> isUserAnAuthorAndIsPostEncryptedErrorOutput)
        {
            throw new GraphQLException(new Error(
                isUserAnAuthorAndIsPostEncryptedErrorOutput.Item1,
                isUserAnAuthorAndIsPostEncryptedErrorOutput.Item2
            ));
        }
        else if (isUserAnAuthorAndIsPostEncrypted is Tuple<bool, bool> isUserAnAuthorAndIsPostEncryptedSuccessOutput)
        {
            if (!isUserAnAuthorAndIsPostEncryptedSuccessOutput.Item1)
            {
                throw new GraphQLException(new Error(
                    @"You cannot edit a caption to a post that you aren't an author of.",
                    "UNAUTHORIZED"
                ));
            }
            isEncrypted = isUserAnAuthorAndIsPostEncryptedSuccessOutput.Item2;
        }
        
        IDatabase? redisCachingDatabase = null;
        try
        {
            redisCachingDatabase = redisClient.GetDatabase(0);
        }
        catch
        {
            //pass
        }

        var editCaptionOfPostResult = await captionService.EditCaptionOfPost(
            overallPostId, newCaptionContent, isEncrypted, encryptionAndDecryptionService,
            postgresContext, redisCachingDatabase!, sqlServerContext
        );

        if (editCaptionOfPostResult is Tuple<string, string> addCaptionToPostResultErrorOutput)
        {
            throw new GraphQLException(new Error(
                addCaptionToPostResultErrorOutput.Item1,
                addCaptionToPostResultErrorOutput.Item2
            ));
        }

        return (bool) editCaptionOfPostResult; 
    }


    [EnableRateLimiting("5PerMinute")]
    public async Task<bool> DeleteCaptionOfPost(
        int authUserId, string overallPostId,
        [Service] IHttpContextAccessor httpContextAccessor, [Service] UserAuthService userAuthService,
        [Service] IHttpClientFactory httpClientFactory, [Service] SqlServerContext sqlServerContext,
        [Service] PostInfoFetchingService postInfoFetchingService, [Service] IConnectionMultiplexer
        redisClient, [Service] CaptionService captionService
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

        var isUserAnAuthorAndIsPostEncrypted = await postInfoFetchingService
        .checkIfUserIsAnAuthorAndAlsoGetEncryptionStatusOfPost(
            authUserId,
            overallPostId,
            httpClientWithMutualTLS
        );

        if (isUserAnAuthorAndIsPostEncrypted is Tuple<string, string> isUserAnAuthorAndIsPostEncryptedErrorOutput)
        {
            throw new GraphQLException(new Error(
                isUserAnAuthorAndIsPostEncryptedErrorOutput.Item1,
                isUserAnAuthorAndIsPostEncryptedErrorOutput.Item2
            ));
        }
        else if (isUserAnAuthorAndIsPostEncrypted is Tuple<bool, bool> isUserAnAuthorAndIsPostEncryptedSuccessOutput)
        {
            if (!isUserAnAuthorAndIsPostEncryptedSuccessOutput.Item1)
            {
                throw new GraphQLException(new Error(
                    @"You cannot remove a caption from a post that you aren't an author of.",
                    "UNAUTHORIZED"
                ));
            }
            isEncrypted = isUserAnAuthorAndIsPostEncryptedSuccessOutput.Item2;
        }
        
        IDatabase? redisCachingDatabase = null;
        try
        {
            redisCachingDatabase = redisClient.GetDatabase(0);
        }
        catch
        {
            //pass
        }

        var deleteCaptionOfPostResult = await captionService.DeleteCaptionOfPost(
            overallPostId, isEncrypted, redisCachingDatabase!, sqlServerContext
        );

        if (deleteCaptionOfPostResult is Tuple<string, string> deleteCaptionOfPostResultErrorOutput)
        {
            throw new GraphQLException(new Error(
                deleteCaptionOfPostResultErrorOutput.Item1,
                deleteCaptionOfPostResultErrorOutput.Item2
            ));
        }
        return (bool) deleteCaptionOfPostResult;
    }
}