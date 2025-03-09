using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Services;
using aspNetCoreBackend1.Models.SqlServer.Caption;

using System.Text.Json;
using System.Text;

using MongoDB.Bson;
using Microsoft.EntityFrameworkCore;

namespace aspNetCoreBackend1.graphql.Mutations;


public class CaptionMutationProvider
{


    public async Task<bool> AddCaptionToPost(
        int authUserId, string overallPostId, string captionContent,
        [Service] IHttpContextAccessor httpContextAccessor, [Service] UserAuthService userAuthService,
        [Service] IHttpClientFactory httpClientFactory, [Service] SqlServerContext sqlServerContext,
        [Service] PostgresContext postgresContext, [Service] EncryptionAndDecryptionService
        encryptionAndDecryptionService, [Service] PostInfoFetchingService postInfoFetchingService
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

        if (isEncrypted)
        {
            try
            {
                byte[]? encryptedDataEncryptionKey = postgresContext
                    .captionsCommentsAndLikesEncryptionInfo
                    .Where(x => x.overallPostId == overallPostId)
                    .Select(x => x.encryptedDataEncryptionKey)
                    .FirstOrDefault();

                byte[] plaintextDataEncryptionKey = await encryptionAndDecryptionService.DecryptEncryptedDataEncryptionKey(
                    encryptedDataEncryptionKey!,
                    $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                );

                var encryptedAuthUserIdInfo = encryptionAndDecryptionService.EncryptTextWithAzureDataEncryptionKey(
                    authUserId.ToString(),
                    plaintextDataEncryptionKey
                );

                byte[] encryptedCaptionContent = encryptionAndDecryptionService
                .EncryptTextWithAzureDataEncryptionKeyGivenIvAndAuthTag(
                    captionContent,
                    plaintextDataEncryptionKey,
                    encryptedAuthUserIdInfo.iv,
                    encryptedAuthUserIdInfo.authTag
                );

                EncryptedCaptionOfPost newEncryptedCaptionOfPost = new EncryptedCaptionOfPost(
                    overallPostId,
                    false,
                    DateTime.Now,
                    encryptedAuthUserIdInfo.encryptedTextBuffer,
                    encryptedCaptionContent,
                    encryptedAuthUserIdInfo.iv,
                    encryptedAuthUserIdInfo.authTag
                );

                await sqlServerContext.encryptedCaptionsOfPosts
                    .AddAsync(newEncryptedCaptionOfPost);
            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble in the process of adding your encrypted caption to this post. This could be due to
                    this post possibly already having a caption, or due to temporary database-issues.",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }
        else
        {
            try
            {
                UnencryptedCaptionOfPost newUnencryptedCaptionOfPost = new UnencryptedCaptionOfPost(
                    overallPostId,
                    false,
                    DateTime.Now,
                    authUserId,
                    captionContent
                );

                await sqlServerContext.unencryptedCaptionsOfPosts
                    .AddAsync(newUnencryptedCaptionOfPost);
            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble adding your caption to this post. This could be due to this post possibly
                    already having a caption, or due to temporary database-issues.",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }

        return true;
    }

    
    public async Task<bool> EditCaptionOfPost(
        int authUserId, string overallPostId, string newCaptionContent,
        [Service] IHttpContextAccessor httpContextAccessor, [Service] UserAuthService userAuthService,
        [Service] IHttpClientFactory httpClientFactory, [Service] SqlServerContext sqlServerContext,
        [Service] PostgresContext postgresContext, [Service] EncryptionAndDecryptionService
        encryptionAndDecryptionService, [Service] PostInfoFetchingService postInfoFetchingService

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
        

        if (isEncrypted)
        {
            try
            {
                EncryptedCaptionOfPost? encryptedCaptionOfPostToEdit = await sqlServerContext
                    .encryptedCaptionsOfPosts
                    .Where(x => x.overallPostId == overallPostId)
                    .FirstOrDefaultAsync();
                
                if (encryptedCaptionOfPostToEdit != null)
                {
                    byte[]? encryptedDataEncryptionKey = postgresContext
                        .captionsCommentsAndLikesEncryptionInfo
                        .Where(x => x.overallPostId == overallPostId)
                        .Select(x => x.encryptedDataEncryptionKey)
                        .FirstOrDefault();

                    byte[] plaintextDataEncryptionKey = await encryptionAndDecryptionService.DecryptEncryptedDataEncryptionKey(
                        encryptedDataEncryptionKey!,
                        $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                    );

                    encryptedCaptionOfPostToEdit!.isEdited = true;
                    encryptedCaptionOfPostToEdit!.encryptedContent = encryptionAndDecryptionService
                    .EncryptTextWithAzureDataEncryptionKeyGivenIvAndAuthTag(
                        newCaptionContent,
                        plaintextDataEncryptionKey,
                        encryptedCaptionOfPostToEdit.encryptionIv,
                        encryptedCaptionOfPostToEdit.encryptionAuthTag
                    );
                    encryptedCaptionOfPostToEdit!.datetimeOfCaption = DateTime.Now;

                    sqlServerContext.encryptedCaptionsOfPosts.Update(encryptedCaptionOfPostToEdit);
                    await sqlServerContext.SaveChangesAsync();
                }
                else
                {
                    throw new GraphQLException(new Error(
                        @"The post with the provided overallPostId has no caption for you to edit.",
                        "NOT_FOUND"
                    ));
                }
            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble in the process of editing the encrypted caption, if any, of this post.",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }
        else
        {
            try
            {
                UnencryptedCaptionOfPost? unencryptedCaptionOfPostToEdit = await sqlServerContext
                    .unencryptedCaptionsOfPosts
                    .Where(x => x.overallPostId == overallPostId)
                    .FirstOrDefaultAsync();
                
                if (unencryptedCaptionOfPostToEdit != null)
                {
                    unencryptedCaptionOfPostToEdit!.isEdited = true;
                    unencryptedCaptionOfPostToEdit!.content = newCaptionContent;
                    unencryptedCaptionOfPostToEdit!.datetimeOfCaption = DateTime.Now;

                    sqlServerContext.unencryptedCaptionsOfPosts.Update(unencryptedCaptionOfPostToEdit);
                    await sqlServerContext.SaveChangesAsync();
                }
                else
                {
                    throw new GraphQLException(new Error(
                        @"The post with the provided overallPostId has no caption for you to edit.",
                        "NOT_FOUND"
                    ));
                }
            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble editing the unencrypted caption, if any, of this post.",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }

        return true;
    }

    public async Task<bool> DeleteCaptionOfPost(
        int authUserId, string overallPostId,
        [Service] IHttpContextAccessor httpContextAccessor, [Service] UserAuthService userAuthService,
        [Service] IHttpClientFactory httpClientFactory, [Service] SqlServerContext sqlServerContext,
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

        int numCaptionsDeleted = 0;
        if (isEncrypted)
        {
            try
            {
                numCaptionsDeleted = await sqlServerContext
                    .encryptedCaptionsOfPosts
                    .Where(x => x.overallPostId == overallPostId)
                    .ExecuteDeleteAsync();
            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble removing the encrypted caption, if any, of this post.",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }
        else
        {
            try
            {
                numCaptionsDeleted = await sqlServerContext
                    .unencryptedCaptionsOfPosts
                    .Where(x => x.overallPostId == overallPostId)
                    .ExecuteDeleteAsync();
            }
            catch
            {
                throw new GraphQLException(new Error(
                    @"There was trouble removing the unencrypted caption, if any, of this post.",
                    "INTERNAL_SERVER_ERROR"
                ));
            }
        }

        return numCaptionsDeleted==1;
    }
}