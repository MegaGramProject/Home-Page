using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Models.SqlServer.Caption;

using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;

namespace aspNetCoreBackend1.Services;

public class CaptionService
{


    public async Task<object> AddCaptionToPost(
        int authUserId, string overallPostId, string captionContent, bool isEncrypted,
        EncryptionAndDecryptionService encryptionAndDecryptionService, PostgresContext postgresContext,
        IDatabase redisCachingDatabase, SqlServerContext sqlServerContext
    )
    {
        if (isEncrypted)
        {
            try
            {
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
                
                try
                {
                    await redisCachingDatabase!.HashDeleteAsync(
                        "Posts and their Captions",
                        overallPostId
                    );
                }
                catch
                {
                    //pass
                }
                
                return true;
            }
            catch
            {
                return (
                    @"There was trouble in the process of adding your encrypted caption to this post. This could be due to
                    this post possibly already having a caption, or due to temporary database-issues.",
                    "INTERNAL_SERVER_ERROR"
                );
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
                
                try
                {
                    await redisCachingDatabase!.HashDeleteAsync(
                        "Posts and their Captions",
                        overallPostId
                    );
                }
                catch
                {
                    //pass
                }

                return true;
            }
            catch
            {
                return (
                    @"There was trouble adding your caption to this post. This could be due to this post possibly
                    already having a caption, or due to temporary database-issues.",
                    "INTERNAL_SERVER_ERROR"
                );
            }
        }
    }

    public async Task<object> EditCaptionOfPost(
        string overallPostId, string newContent, bool isEncrypted,
        EncryptionAndDecryptionService encryptionAndDecryptionService, PostgresContext postgresContext,
        IDatabase redisCachingDatabase, SqlServerContext sqlServerContext
    )
    {
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
                    byte[] plaintextDataEncryptionKey = await encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                    (
                        overallPostId!,
                        postgresContext,
                        encryptionAndDecryptionService,
                        redisCachingDatabase!
                    );

                    encryptedCaptionOfPostToEdit!.isEdited = true;
                    encryptedCaptionOfPostToEdit!.encryptedContent = encryptionAndDecryptionService
                    .EncryptTextWithAzureDataEncryptionKeyGivenIvAndAuthTag(
                        newContent,
                        plaintextDataEncryptionKey,
                        encryptedCaptionOfPostToEdit.encryptionIv,
                        encryptedCaptionOfPostToEdit.encryptionAuthTag
                    );
                    encryptedCaptionOfPostToEdit!.datetimeOfCaption = DateTime.Now;

                    sqlServerContext.encryptedCaptionsOfPosts.Update(encryptedCaptionOfPostToEdit);
                    await sqlServerContext.SaveChangesAsync();
                    return true;
                }

                return false;
            }
            catch
            {
                return (
                    @"There was trouble in the process of editing the encrypted caption, if any, of this post.",
                    "INTERNAL_SERVER_ERROR"
                );
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
                    unencryptedCaptionOfPostToEdit!.content = newContent;
                    unencryptedCaptionOfPostToEdit!.datetimeOfCaption = DateTime.Now;

                    sqlServerContext.unencryptedCaptionsOfPosts.Update(unencryptedCaptionOfPostToEdit);
                    await sqlServerContext.SaveChangesAsync();
                    return true;
                }
                
                return false;
            }
            catch
            {
                return (
                    @"There was trouble editing the unencrypted caption, if any, of this post.",
                    "INTERNAL_SERVER_ERROR"
                );
            }
        }
    }

    public async Task<object> DeleteCaptionOfPost(
        string overallPostId, bool isEncrypted, IDatabase redisCachingDatabase, SqlServerContext sqlServerContext
    )
    {
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

        if (numCaptionsDeleted == 1)
        {
            try
            {
                await redisCachingDatabase.HashDeleteAsync(
                    "Posts and their Captions",
                    overallPostId
                );
            }
            catch
            {
                //pass
            }
        }

        return numCaptionsDeleted==1;
    }
}