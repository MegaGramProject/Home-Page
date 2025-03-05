using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Models.Postgres.PostOrCommentLike;

using System.Text.Json;
using System.Text;

using Microsoft.EntityFrameworkCore;

namespace aspNetCoreBackend1.Services;


public class PostOrCommentLikingService
{
    public async Task<object> AddLikeToPostOrComment(
        bool? isEncrypted, int authUserId, HttpClient httpClient, string overallPostId,
        int? commentId, PostgresContext postgresContext, EncryptionAndDecryptionService
        encryptionAndDecryptionService, byte[] plaintextDataEncryptionKey
    )
    {
        int[] authorsOfPost = [];
        try
        {
            HttpRequestMessage request0 = new HttpRequestMessage(
                HttpMethod.Get,
                @$"http://34.111.89.101/api/Home-Page/expressJSBackend1/getAuthorsAndEncryptionStatusOfPost
                /{overallPostId}"
            );

            HttpResponseMessage response0 = await httpClient.SendAsync(request0);
            

            if (!response0.IsSuccessStatusCode)
            {
                if (response0.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return (
                        404,
                        @"There doesn't currently exist a post with the overallPostId that you provided."
                    );
                    
                }
                return (
                    502, 
                    @"The expressJSBackend1 server had trouble getting the authors and encryption-status of the post.
                    This step is required because the post could possibly be encrypted and if it is, you must be following
                    at-least one of the authors in order to add a like to this post. If it isn't encrypted,
                    then you cannot be blocked by all of the post-authors in order to add a like to this post."
                ); 
            }

            string stringifiedResponse0Data = await response0.Content.ReadAsStringAsync();
            Dictionary<string, object>? parsedResponse0Data = JsonSerializer.Deserialize<Dictionary<string, object>>(
                stringifiedResponse0Data
            );

            authorsOfPost = (int[]) parsedResponse0Data!["authorsOfPost"];
            isEncrypted = (bool) parsedResponse0Data["isEncrypted"];
        }
        catch
        {
            return (
                502, 
                @"There was trouble connecting to the expressJSBackend1 server to get the authors and encryption-
                status of the post. This step is required because the post could possibly be encrypted
                and if it is, you must be following at-least one of the authors in order to add a like to this
                post. If it isn't encrypted, then you cannot be blocked by all of the post-authors in order
                to add a like to this post."
            ); 
        } 

        int idOfNewLike = -1;
        if (isEncrypted == false)
        {
            try
            {
                HttpRequestMessage request = new HttpRequestMessage(
                    HttpMethod.Post,
                    @$"http://34.111.89.101/api/Home-Page/djangoBackend2/isEachUserInListInTheBlockingsOfAuthUser
                    /{authUserId}"
                );

                request.Content = new StringContent(
                    JsonSerializer.Serialize(
                        new {
                            list = authorsOfPost
                        }
                    ),
                    Encoding.UTF8,
                    "application/json"
                );

                HttpResponseMessage response = await httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    return (502, @"The djangoBackend2 server had trouble checking whether or not
                    each of the authors of this post either block you or are blocked by you.");
                }

                string stringifiedResponseData = await response.Content.ReadAsStringAsync();
                bool? eachPostAuthorIsInAuthUserBlockings = JsonSerializer.Deserialize<bool>(
                    stringifiedResponseData
                );
                if (eachPostAuthorIsInAuthUserBlockings == true)
                {
                    return (404, "You are trying to like a post/comment that does not exist.");
                }
            }
            catch
            {
                return (502, @"There was trouble connecting to the djangoBackend2 server to check whether or not
                each of the authors of this unencrypted post either block you or are blocked by you.");
            }
            
            UnencryptedPostOrCommentLike newUnencryptedPostOrCommentLike = new UnencryptedPostOrCommentLike(
                commentId == null ? overallPostId : null,
                commentId,
                authUserId,
                DateTime.Now
            );

            try
            {
                await postgresContext
                    .unencryptedPostOrCommentLikes
                    .AddAsync(newUnencryptedPostOrCommentLike);
            }
            catch
            {
                return (500, "There was trouble adding your like to this unencrypted post/comment");
            }
            idOfNewLike = newUnencryptedPostOrCommentLike.id;
        }
        else
        {
            try
            {
                HttpRequestMessage request1 = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"http://34.111.89.101/api/Home-Page/djangoBackend2/checkIfUserFollowsAtLeastOneInList/{authUserId}"
                );

                request1.Content = new StringContent(
                    JsonSerializer.Serialize(
                        new {
                            list = authorsOfPost
                        }
                    ),
                    Encoding.UTF8,
                    "application/json"
                );

                HttpResponseMessage response1 = await httpClient.SendAsync(request1);
                
                if (!response1.IsSuccessStatusCode)
                {
                    return (
                        502,
                        @"The djangoBackend2 server had trouble verifying whether or not you follow at-least one of the
                        authors of this private-post."
                    );
                }

                string stringifiedDataForResponse1 = await response1.Content.ReadAsStringAsync();
                bool userFollowsAtLeastOneAuthor = JsonSerializer.Deserialize<bool>(stringifiedDataForResponse1);
                if (!userFollowsAtLeastOneAuthor) {
                    return (
                        403,
                        @"You are not authorized to add a like to this private-post since you do not follow
                        at-least one of its authors."
                    );
                }
            }
            catch
            {
                return (
                    502,
                    @"There was trouble connecting to the djangoBackend2 server to verify whether or not you follow at-least 
                    one of the authors of this private-post."
                );
            } 

            if (plaintextDataEncryptionKey == null)
            {
                byte[]? encryptedDataEncryptionKey = postgresContext
                    .captionsCommentsAndLikesEncryptionInfo
                    .Where(x => x.overallPostId == overallPostId)
                    .Select(x => x.encryptedDataEncryptionKey)
                    .FirstOrDefault();

                plaintextDataEncryptionKey = await encryptionAndDecryptionService.DecryptEncryptedDataEncryptionKey(
                    encryptedDataEncryptionKey!,
                    $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                );
            }

            var encryptedAuthUserIdInfo = encryptionAndDecryptionService.EncryptTextWithAzureDataEncryptionKey(
                authUserId.ToString(),
                plaintextDataEncryptionKey
            );

            EncryptedPostOrCommentLike newEncryptedPostOrCommentLike = new EncryptedPostOrCommentLike(
                commentId == null ? overallPostId : null,
                commentId,
                encryptedAuthUserIdInfo.encryptedTextBuffer,
                encryptedAuthUserIdInfo.iv,
                encryptedAuthUserIdInfo.authTag,
                DateTime.Now
            );

            try
            {
                await postgresContext
                    .encryptedPostOrCommentLikes
                    .AddAsync(newEncryptedPostOrCommentLike);
            }
            catch
            {
                return (
                    500,
                    "There was trouble adding your like to this encrypted post/comment"
                );
            }

            idOfNewLike = newEncryptedPostOrCommentLike.id;
        }

        return idOfNewLike;
    }

    public async Task<object> RemoveLikeFromPostOrComment(
        PostgresContext postgresContext, SqlServerContext sqlServerContext, string? overallPostId, int? commentId,
        int authUserId, EncryptionAndDecryptionService encryptionAndDecryptionService
    )
    {
        bool? isEncrypted = null;
        byte[]? plaintextDataEncryptionKey = null;
        try
        {
            List<int> likersOfUnencryptedPostOrComment = await postgresContext
                .unencryptedPostOrCommentLikes
                .Where(x => commentId == null ? x.overallPostId == overallPostId : x.commentId == commentId)
                .Select(x => x.likerId)
                .ToListAsync();
                
            HashSet<int> setOfLikersOfUnencryptedPostOrComment = new HashSet<int>(likersOfUnencryptedPostOrComment);

            if (setOfLikersOfUnencryptedPostOrComment.Count > 0)
            {
                isEncrypted = false;
                if (setOfLikersOfUnencryptedPostOrComment.Contains(authUserId))
                {
                    try
                    {
                        await postgresContext
                            .unencryptedPostOrCommentLikes
                            .Where(x => x.likerId == authUserId &&
                                (
                                    commentId == null ? x.overallPostId == overallPostId : x.commentId == commentId
                                )
                            )
                            .ExecuteDeleteAsync();
                        
                        return true;
                    }
                    catch
                    {
                        return (
                            500,
                            "There was trouble removing your like from this unencrypted post/comment"
                        );
                    }
                }
            }
            else
            {
                var likesOfEncryptedPostOrComment = await postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => commentId == null ? x.overallPostId == overallPostId : x.commentId == commentId)
                    .Select(x => new {x.id, x.encryptedLikerId, x.encryptionIv, x.encryptionAuthTag})
                    .ToListAsync();
                
                if (likesOfEncryptedPostOrComment.Count > 0)
                {
                    isEncrypted = true;

                    if (commentId != null)
                    {
                        overallPostId = await sqlServerContext
                            .encryptedCommentsOfPosts
                            .Where(x => x.id == commentId)
                            .Select(x => x.overallPostId)
                            .FirstOrDefaultAsync();
                    }

                    byte[]? encryptedDataEncryptionKey = postgresContext
                        .captionsCommentsAndLikesEncryptionInfo
                        .Where(x => x.overallPostId == overallPostId)
                        .Select(x => x.encryptedDataEncryptionKey)
                        .FirstOrDefault();

                    plaintextDataEncryptionKey = await encryptionAndDecryptionService
                    .DecryptEncryptedDataEncryptionKey(
                        encryptedDataEncryptionKey!,
                        $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                    );

                    foreach(var encryptedLikeInfo in likesOfEncryptedPostOrComment)
                    {
                        string stringifiedLikerId = encryptionAndDecryptionService
                        .DecryptTextWithAzureDataEncryptionKey(
                            encryptedLikeInfo.encryptedLikerId,
                            plaintextDataEncryptionKey,
                            encryptedLikeInfo.encryptionIv,
                            encryptedLikeInfo.encryptionAuthTag
                        );
                        int likerId = int.Parse(stringifiedLikerId);
                        if (likerId == authUserId)
                        {
                            try
                            {
                                await postgresContext.
                                    encryptedPostOrCommentLikes
                                    .Where(x => x.id == encryptedLikeInfo.id)
                                    .ExecuteDeleteAsync();
                                
                                return true;
                            }
                            catch
                            {
                                return (
                                    500,
                                    "There was trouble removing your like from this encrypted post/comment"
                                );
                            }
                        }
                    }
                }
            }
        }
        catch
        {
            return (
                500,
                "There was trouble removing your like, if it was even present, from this post/comment."
            );
        }


        return new Dictionary<string, object>()
        {
            { "isEncrypted", isEncrypted! },
            { "plaintextDataEncryptionKey", plaintextDataEncryptionKey! }
        };
    }
}