using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Models.SqlServer.Comment;
using aspNetCoreBackend1.graphql.Types;

namespace aspNetCoreBackend1.Services;


public class CommentsService
{


    public async Task<List<Dictionary<string, object>>> GetBatchOfCommentsWithInDepthInfo()
    {
        int authUserId, int maxBatchSize, int[] authorsOfPost, byte[] plaintextDataEncryptionKey, PostgresContext postgresContext,
        SqlServerContext sqlServerContext, Dictionary<string, List<Dictionary<string, object>>> commenterStatusesAndTheirComments,
        EncryptionAndDecryptionService encryptionAndDecryptionService
    }
    {
        bool isEncrypted = plaintextDataEncryptionKey == null;

        int numAdditionalCommentsNeededForBatch = maxBatchSize;
        List<Dictionary<string, object>> batchOfCommentsWithInDepthInfo = new List<Dictionary<string, object>>();
        Dictionary <int, int> commentsAndTheirNumLikes = new Dictionary<int, int>();
        Dictionary <int, int> commentsAndTheirNumReplies = new Dictionary<int, int>();

        List<Dictionary<string, object>> commentsMadeByAuthUser = commenterStatusesAndTheirComments["You"];
        List<Dictionary<string, object>> commentsMadeByFollowing = commenterStatusesAndTheirComments["Following"];
        List<Dictionary<string, object>> commentsMadeByAuthor = commenterStatusesAndTheirComments["Author"];
        List<Dictionary<string, object>> commentsMadeByStranger = commenterStatusesAndTheirComments["Stranger"];

        if (commentsMadeByAuthUser.Count > 0)
        {
            HashSet<int> idsOfAuthUserComments = new HashSet<int>();

            foreach(Dictionary<string, object> authUserComment in commentsMadeByAuthUser)
            {
                idsOfAuthUserComments.Add((int) authUserComment["id"]);
            }

            if (isEncrypted) {
                commentsAndTheirNumLikes = postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => idsOfAuthUserComments.Contains(x.commentId ?? -1))
                    .GroupBy(x => x.commentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
                
                commentsAndTheirNumReplies = sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => idsOfAuthUserComments.Contains(x.parentCommentId ?? -1))
                    .GroupBy(x => x.parentCommentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
            }
            else {
                 commentsAndTheirNumLikes = postgresContext
                    .unencryptedPostOrCommentLikes
                    .Where(x => idsOfAuthUserComments.Contains(x.commentId ?? -1))
                    .GroupBy(x => x.commentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
                
                commentsAndTheirNumReplies = sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => idsOfAuthUserComments.Contains(x.parentCommentId ?? -1))
                    .GroupBy(x => x.parentCommentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
            }

            foreach(Dictionary<string, object> authUserComment in commentsMadeByAuthUser)
            {
                authUserComment["numLikes"] = commentsAndTheirNumLikes.GetValueOrDefault(authUserComment["id"], 0);
                authUserComment["numReplies"] = commentsAndTheirNumReplies.GetValueOrDefault(authUserComment["id"], 0);
            }

            commentsMadeByAuthUser = commentsMadeByAuthUser.OrderByDescending(
                authUserComment => authUserComment["numReplies"] + authUserComment["numLikes"]
            ).ToList();

            int numAuthUserCommentsThatAreAddedInBatch = Math.Min(commentsMadeByAuthUser.Count, numAdditionalCommentsNeededForBatch);

            for(int i=0; i<numAuthUserCommentsThatAreAddedInBatch; i++) {
                batchOfCommentsWithInDepthInfo.Add(commentsMadeByAuthUser[i]);
            }

            numAdditionalCommentsNeededForBatch-= numAuthUserCommentsThatAreAddedInBatch;
        }

        if (numAdditionalCommentsNeededForBatch > 0 && commentsMadeByFollowing.Count > 0)
        {
            HashSet<int> idsOfCommentsMadeByFollowing = new HashSet<int>();

            foreach(Dictionary<string, object> authUserFollowingComment in commentsMadeByFollowing)
            {
                idsOfCommentsMadeByFollowing.Add((int) authUserFollowingComment["id"]);
            }

            if (isEncrypted) {
                commentsAndTheirNumLikes = postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => idsOfCommentsMadeByFollowing.Contains(x.commentId ?? -1))
                    .GroupBy(x => x.commentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
                
                commentsAndTheirNumReplies = sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => idsOfCommentsMadeByFollowing.Contains(x.parentCommentId ?? -1))
                    .GroupBy(x => x.parentCommentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
            }
            else {
                 commentsAndTheirNumLikes = postgresContext
                    .unencryptedPostOrCommentLikes
                    .Where(x => idsOfCommentsMadeByFollowing.Contains(x.commentId ?? -1))
                    .GroupBy(x => x.commentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
                
                commentsAndTheirNumReplies = sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => idsOfCommentsMadeByFollowing.Contains(x.parentCommentId ?? -1))
                    .GroupBy(x => x.parentCommentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
            }

            foreach(Dictionary<string, object> authUserFollowingComment in commentsMadeByFollowing)
            {
                authUserFollowingComment["numLikes"] = commentsAndTheirNumLikes.GetValueOrDefault(
                    authUserFollowingComment["id"],
                    0
                );
                authUserFollowingComment["numReplies"] = commentsAndTheirNumReplies.GetValueOrDefault(
                    authUserFollowingComment["id"],
                    0
                );
            }

            commentsMadeByFollowing = commentsMadeByFollowing.OrderByDescending(
                authUserFollowingComment => authUserFollowingComment["numReplies"] + authUserFollowingComment["numLikes"]
            ).ToList();

            int numAuthUserFollowingCommentsThatAreAddedInBatch = Math.Min(
                commentsMadeByFollowing.Count,
                numAdditionalCommentsNeededForBatch
            );

            for(int i=0; i<numAuthUserFollowingCommentsThatAreAddedInBatch; i++) {
                batchOfCommentsWithInDepthInfo.Add(commentsMadeByFollowing[i]);
            }

            numAdditionalCommentsNeededForBatch-= numAuthUserFollowingCommentsThatAreAddedInBatch;
        }

        if (numAdditionalCommentsNeededForBatch > 0 && commentsMadeByAuthor.Count > 0)
        {
            HashSet<int> idsOfCommentsMadeByAuthor = new HashSet<int>();

            foreach(Dictionary<string, object> authorComment in commentsMadeByAuthor)
            {
                idsOfCommentsMadeByAuthor.Add((int) authorComment["id"]);
            }

            if (isEncrypted) {
                commentsAndTheirNumLikes = postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => idsOfCommentsMadeByAuthor.Contains(x.commentId ?? -1))
                    .GroupBy(x => x.commentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
                
                commentsAndTheirNumReplies = sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => idsOfCommentsMadeByAuthor.Contains(x.parentCommentId ?? -1))
                    .GroupBy(x => x.parentCommentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
            }
            else {
                 commentsAndTheirNumLikes = postgresContext
                    .unencryptedPostOrCommentLikes
                    .Where(x => idsOfCommentsMadeByAuthor.Contains(x.commentId ?? -1))
                    .GroupBy(x => x.commentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
                
                commentsAndTheirNumReplies = sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => idsOfCommentsMadeByAuthor.Contains(x.parentCommentId ?? -1))
                    .GroupBy(x => x.parentCommentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
            }

            foreach(Dictionary<string, object> authorComment in commentsMadeByAuthor)
            {
                authorComment["numLikes"] = commentsAndTheirNumLikes.GetValueOrDefault(
                    authorComment["id"],
                    0
                );
                authorComment["numReplies"] = commentsAndTheirNumReplies.GetValueOrDefault(
                    authorComment["id"],
                    0
                );
            }

            commentsMadeByAuthor = commentsMadeByAuthor.OrderByDescending(
                authorComment => authorComment["numReplies"] + authorComment["numLikes"]
            ).ToList();

            int numAuthorCommentsThatAreAddedInBatch = Math.Min(
                commentsMadeByAuthor.Count,
                numAdditionalCommentsNeededForBatch
            );

            for(int i=0; i<numAuthorCommentsThatAreAddedInBatch; i++) {
                batchOfCommentsWithInDepthInfo.Add(commentsMadeByAuthor[i]);
            }

            numAdditionalCommentsNeededForBatch-= numAuthorCommentsThatAreAddedInBatch;
        }

        if (numAdditionalCommentsNeededForBatch > 0 && commentsMadeByStranger.Count > 0)
        {
            HashSet<int> idsOfStrangerComments = new HashSet<int>();

            foreach(Dictionary<string, object> strangerComment in commentsMadeByStranger)
            {
                idsOfStrangerComments.Add((int) authUserFollowingComment["id"]);
            }

            if (isEncrypted) {
                commentsAndTheirNumLikes = postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => idsOfStrangerComments.Contains(x.commentId ?? -1))
                    .GroupBy(x => x.commentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
                
                commentsAndTheirNumReplies = sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => idsOfStrangerComments.Contains(x.parentCommentId ?? -1))
                    .GroupBy(x => x.parentCommentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
            }
            else {
                 commentsAndTheirNumLikes = postgresContext
                    .unencryptedPostOrCommentLikes
                    .Where(x => idsOfStrangerComments.Contains(x.commentId ?? -1))
                    .GroupBy(x => x.commentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
                
                commentsAndTheirNumReplies = sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => idsOfStrangerComments.Contains(x.parentCommentId ?? -1))
                    .GroupBy(x => x.parentCommentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
            }

            foreach(Dictionary<string, object> strangerComment in commentsMadeByStranger)
            {
                strangerComment["numLikes"] = commentsAndTheirNumLikes.GetValueOrDefault(
                    strangerComment["id"],
                    0
                );
                strangerComment["numReplies"] = commentsAndTheirNumReplies.GetValueOrDefault(
                    strangerComment["id"],
                    0
                );
            }

            commentsMadeByStranger = commentsMadeByStranger.OrderByDescending(
                strangerComment => strangerComment["numReplies"] + strangerComment["numLikes"]
            ).ToList();

            int numStrangerCommentsAddedIntoBatch = Math.Min(
                commentsMadeByStranger.Count,
                numAdditionalCommentsNeededForBatch
            );

            for(int i=0; i<numStrangerCommentsAddedIntoBatch; i++) {
                batchOfCommentsWithInDepthInfo.Add(commentsMadeByStranger[i]);
            }

            numAdditionalCommentsNeededForBatch-= numStrangerCommentsAddedIntoBatch;
        }

        HashSet<int> idsOfEachCommentInBatch = new HashSet<int>();

        if (batchOfCommentsWithInDepthInfo.Count > 0)
        {
            foreach(Dictionary<string, object> inDepthComment in batchOfCommentsWithInDepthInfo)
            {
                idsOfEachCommentInBatch.add(inDepthComment["id"]);
            } 

            HashSet<int> commentIdsInBatchThatAreLikedByAuthUser = new HashSet<int>();
            HashSet<int> commentIdsInBatchThatAreLikedByPostAuthor = new HashSet<int>();

            try {
                if (isEncrypted) {
                    var encryptedLikesOfCommentsInBatch = await postgresContext
                        .unencryptedPostOrCommentLikes
                        .Where(x => 
                            idsOfEachCommentInBatch.Contains(x.commentId ?? -1)
                        )
                        .Select(x => x.commentId!.Value, x.encryptedLikerId, x.encryptionIv, x.encryptionAuthTag)
                        .ToListAsync();
                    
                    foreach(var encryptedCommentLike in encryptedLikesOfCommentsInBatch) {
                        int commentId = encryptedCommentLike.commentId;

                        string likerIdAsString = encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                            encryptedCommentLike.encryptedLikerId,
                            plaintextDataEncryptionKey,
                            encryptedCommentLike.encryptionIv,
                            encryptedCommentLike.encryptionAuthTag
                        );

                        int likerId = int.Parse(likerIdAsString);

                        if (likerId == authUserId) {
                            commentIdsInBatchThatAreLikedByAuthUser.Add(commentId);
                        }
                        else if (authorsOfPost.Contains(likerId)) {
                            commentIdsInBatchThatAreLikedByPostAuthor.Add(commentId);
                        }
                    }
                }
                else {
                    commentIdsInBatchThatAreLikedByAuthUser = await postgresContext
                        .unencryptedPostOrCommentLikes
                        .Where(x => 
                            x.LikerId == authUserId &&
                            idsOfEachCommentInBatch.Contains(x.commentId ?? -1)
                        )
                        .Select(x => x.commentId!.Value)
                        .ToHashSetAsync();

                    commentIdsInBatchThatAreLikedByPostAuthor = await postgresContext
                        .unencryptedPostOrCommentLikes
                        .Where(x => 
                            authorsOfPost.Contains(x.LikerId) &&
                            idsOfEachCommentInBatch.Contains(x.commentId ?? -1)
                        )
                        .Select(x => x.commentId!.Value)
                        .ToHashSetAsync();
                }


                foreach(Dictionary<string, object> inDepthComment in batchOfCommentsWithInDepthInfo)
                {
                    inDepthComment["isLikedByAuthUser"] = commentIdsInBatchThatAreLikedByAuthUser.Contains(
                        inDepthComment["id"];
                    );
                    inDepthComment["isLikedByPostAuthor"] = commentIdsInBatchThatAreLikedByPostAuthor.Contains(
                        inDepthComment["id"];
                    );
                }
            }
            catch  {}
        }

        return batchOfCommentsWithInDepthInfo;
    }
}