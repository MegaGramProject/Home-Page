using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Models.SqlServer.Comment;
using aspNetCoreBackend1.graphql.Types;

namespace aspNetCoreBackend1.Services;


public class CommentsService
{


    public List<CommentWithNumLikesAndNumReplies> SortAndFilterOutCommentsForBatch(
        int? authUserId, int batchSize, int[] authorsOfPost, HashSet<int> setOfUsersFollowedByAuthUser, bool isEncrypted,
        PostgresContext postgresContext, SqlServerContext sqlServerContext, List<UnencryptedCommentOfPost> allComments
    )
    {
        List<UnencryptedCommentOfPost> commentsMadeByAuthUser = new List<UnencryptedCommentOfPost>();
        List<UnencryptedCommentOfPost> commentsMadeByAuthUsersFollowing = new List<UnencryptedCommentOfPost>();
        List<UnencryptedCommentOfPost> commentsMadeByAPostAuthor = new List<UnencryptedCommentOfPost>();
        List<UnencryptedCommentOfPost> commentsMadeByOthers = new List<UnencryptedCommentOfPost>();
        HashSet<int> setOfIdsOfCommentsNotMadeByOthers = new HashSet<int>();
        HashSet<int> setOfIdsOfCommentsMadeByOthers = new HashSet<int>();
        int numCommentsFound = 0;

        foreach(UnencryptedCommentOfPost comment in allComments)
        {
            int commentAuthor = comment.authorId;

            if (commentAuthor == authUserId)
            {
                commentsMadeByAuthUser.Add(comment);
                setOfIdsOfCommentsNotMadeByOthers.Add(comment.id);
                numCommentsFound++;
            }
            else if (setOfUsersFollowedByAuthUser.Contains(commentAuthor))
            {
                commentsMadeByAuthUsersFollowing.Add(comment);
                setOfIdsOfCommentsNotMadeByOthers.Add(comment.id);
                numCommentsFound++;
            }
            else if (authorsOfPost.Contains(commentAuthor))
            {
                commentsMadeByAPostAuthor.Add(comment);
                setOfIdsOfCommentsNotMadeByOthers.Add(comment.id);
                numCommentsFound++;
            }
            else
            {
                commentsMadeByOthers.Add(comment);
                setOfIdsOfCommentsMadeByOthers.Add(comment.id);
            }

            if (numCommentsFound == batchSize)
            {
                break;
            }
        }

        List<UnencryptedCommentOfPost> batchOfComments = commentsMadeByAuthUser.Concat(
            commentsMadeByAuthUsersFollowing
        ).ToList();
        batchOfComments = batchOfComments.Concat(commentsMadeByAPostAuthor).ToList();

        Dictionary <int, int> numLikesOfEachCommentMadeByOthers = new Dictionary<int, int>();
        Dictionary <int, int> numRepliesOfEachCommentMadeByOthers = new Dictionary<int, int>();

        if (numCommentsFound < batchSize && commentsMadeByOthers.Count > 0)
        {
            Dictionary<int, int> commentIdsAndTheirSumOfNumLikesAndNumReplies = new Dictionary<int, int>();
            Dictionary<int, UnencryptedCommentOfPost> commentIdsAndTheirObjects = new Dictionary<int,
            UnencryptedCommentOfPost>();

            foreach(UnencryptedCommentOfPost commentMadeByOther in commentsMadeByOthers)
            {
                commentIdsAndTheirObjects[
                    commentMadeByOther.id
                ] = commentMadeByOther;

                setOfIdsOfCommentsMadeByOthers.Add(commentMadeByOther.id);
            }

            if (isEncrypted)
            {
                numLikesOfEachCommentMadeByOthers = postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => setOfIdsOfCommentsMadeByOthers.Contains(x.commentId ?? -1))
                    .GroupBy(x => x.commentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
                
                numRepliesOfEachCommentMadeByOthers = sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => setOfIdsOfCommentsMadeByOthers.Contains(x.parentCommentId ?? -1))
                    .GroupBy(x => x.parentCommentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());

            }
            else
            {
                numLikesOfEachCommentMadeByOthers = postgresContext
                    .unencryptedPostOrCommentLikes
                    .Where(x => setOfIdsOfCommentsMadeByOthers.Contains(x.commentId ?? -1))
                    .GroupBy(x => x.commentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
                
                numRepliesOfEachCommentMadeByOthers = sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => setOfIdsOfCommentsMadeByOthers.Contains(x.parentCommentId ?? -1))
                    .GroupBy(x => x.parentCommentId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());
            }

            foreach(int commentId in setOfIdsOfCommentsMadeByOthers)
            {
                int numLikesOfComment = numLikesOfEachCommentMadeByOthers.GetValueOrDefault(commentId, 0);

                int numRepliesOfComment = numRepliesOfEachCommentMadeByOthers.GetValueOrDefault(commentId, 0);

                commentIdsAndTheirSumOfNumLikesAndNumReplies[commentId] = numLikesOfComment + numRepliesOfComment;
            }

            List<int> commentIdsSortedInDescOfTheirSumOfLikesAndReplies =
            commentIdsAndTheirSumOfNumLikesAndNumReplies
                .OrderByDescending(dict => dict.Value)
                .Select(dict => dict.Key)
                .ToList();

            for(int i = 0; i < batchSize - numCommentsFound; i++)
            {
                batchOfComments.Add(commentIdsAndTheirObjects[
                    commentIdsSortedInDescOfTheirSumOfLikesAndReplies[i]
                ]);
            }
        }

        Dictionary <int, int> numLikesOfEachCommentNotMadeByOthers = new Dictionary<int, int>();
        Dictionary <int, int> numRepliesOfEachCommentNotMadeByOthers = new Dictionary<int, int>();

        if (isEncrypted)
        {
            numLikesOfEachCommentNotMadeByOthers = postgresContext
                .encryptedPostOrCommentLikes
                .Where(x => setOfIdsOfCommentsNotMadeByOthers.Contains(x.commentId ?? -1))
                .GroupBy(x => x.commentId!.Value)
                .ToDictionary(g => g.Key, g => g.Count());
            
            numRepliesOfEachCommentNotMadeByOthers = sqlServerContext
                .encryptedCommentsOfPosts
                .Where(x => setOfIdsOfCommentsNotMadeByOthers.Contains(x.parentCommentId ?? -1))
                .GroupBy(x => x.parentCommentId!.Value)
                .ToDictionary(g => g.Key, g => g.Count());
        }
        else
        {
            numLikesOfEachCommentNotMadeByOthers = postgresContext
                .unencryptedPostOrCommentLikes
                .Where(x => setOfIdsOfCommentsNotMadeByOthers.Contains(x.commentId ?? -1))
                .GroupBy(x => x.commentId!.Value)
                .ToDictionary(g => g.Key, g => g.Count());
            
            numRepliesOfEachCommentNotMadeByOthers = sqlServerContext
                .unencryptedCommentsOfPosts
                .Where(x => setOfIdsOfCommentsNotMadeByOthers.Contains(x.parentCommentId ?? -1))
                .GroupBy(x => x.parentCommentId!.Value)
                .ToDictionary(g => g.Key, g => g.Count());
        }

        List<CommentWithNumLikesAndNumReplies> output = new List
        <CommentWithNumLikesAndNumReplies>();
        foreach(UnencryptedCommentOfPost singleCommentFromBatch in batchOfComments)
        {
            int commentId = singleCommentFromBatch.id;
            if (setOfIdsOfCommentsNotMadeByOthers.Contains(commentId))
            {
                output.Add(new CommentWithNumLikesAndNumReplies(
                    commentId,
                    singleCommentFromBatch.overallPostId,
                    singleCommentFromBatch.parentCommentId,
                    singleCommentFromBatch.isEdited,
                    singleCommentFromBatch.datetimeOfComment,
                    singleCommentFromBatch.authorId,
                    singleCommentFromBatch.content,
                    numLikesOfEachCommentNotMadeByOthers.GetValueOrDefault(commentId, 0),
                    numRepliesOfEachCommentNotMadeByOthers.GetValueOrDefault(commentId, 0)
                ));
            }
            else
            {
                output.Add(new CommentWithNumLikesAndNumReplies(
                    commentId,
                    singleCommentFromBatch.overallPostId,
                    singleCommentFromBatch.parentCommentId,
                    singleCommentFromBatch.isEdited,
                    singleCommentFromBatch.datetimeOfComment,
                    singleCommentFromBatch.authorId,
                    singleCommentFromBatch.content,
                    numLikesOfEachCommentMadeByOthers.GetValueOrDefault(commentId, 0),
                    numRepliesOfEachCommentMadeByOthers.GetValueOrDefault(commentId, 0)
                ));
            }
        }

        return output;
    }
}