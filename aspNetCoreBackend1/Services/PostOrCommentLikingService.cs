using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Models.Postgres.PostOrCommentLike;

using Microsoft.EntityFrameworkCore;

namespace aspNetCoreBackend1.Services;


public class PostOrCommentLikingService
{
    public async Task<object> AddLikeToPostOrComment(
        bool isEncrypted, int authUserId, string overallPostId, int? commentId, PostgresContext postgresContext,
        EncryptionAndDecryptionService encryptionAndDecryptionService, byte[] plaintextDataEncryptionKey
    )
    {
        int idOfNewLike = -1;

        if (!isEncrypted)
        {
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
        PostgresContext postgresContext, string overallPostId, int? commentId,
        int authUserId, EncryptionAndDecryptionService encryptionAndDecryptionService,
        bool isEncrypted, byte[] plaintextDataEncryptionKey
    )
    {  
        if (!isEncrypted)
        {
            try
            {
                int numLikesDeleted = await postgresContext
                    .unencryptedPostOrCommentLikes
                    .Where(x => x.likerId == authUserId &&
                        (
                            commentId == null ? x.overallPostId == overallPostId : x.commentId == commentId
                        )
                    )
                    .ExecuteDeleteAsync();
                
                return numLikesDeleted == 1;
            }
            catch
            {
                return (
                    500,
                    "There was trouble removing your like from this unencrypted post/comment"
                );
            }
        }
        else
        {
            var likesOfEncryptedPostOrComment = await postgresContext.
                encryptedPostOrCommentLikes
                .Where(x => commentId == null ? x.overallPostId == overallPostId : x.commentId == commentId)
                .Select(x => new { x.id, x.encryptedLikerId, x.encryptionIv, x.encryptionAuthTag })
                .ToListAsync();

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
                        int numLikesDeleted = await postgresContext.
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

            return false;
        }
    }
}