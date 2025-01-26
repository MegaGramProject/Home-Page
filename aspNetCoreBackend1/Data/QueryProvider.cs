using Google.Protobuf.WellKnownTypes;
using Megagram.Models;
using Microsoft.EntityFrameworkCore;

namespace Megagram.Data;

public class QueryProvider
{

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public async Task<IQueryable<Comment>> GetComments([Service] MegaDbContext context)
    {
        var comments = await context.usercomments.ToListAsync();
        return comments.AsQueryable();
    }

    //'http://localhost:5022/getPostIdsThatAreHashtaggedWithTopic/'+topic

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public async Task<IQueryable<Reply>> GetReplies([Service] MegaDbContext context)
    {
        var replies = await context.userreplies.ToListAsync();
        return replies.AsQueryable();
    }

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public async Task<IQueryable<CommentLiker>> GetCommentLikes([Service] MegaDbContext context)
    {
        var commentlikes = await context.commentlikers.ToListAsync();
        return commentlikes.AsQueryable();
    }



    public async Task<List<String>> GetPostIdsThatAreHashtaggedWithTopic([Service] MegaDbContext context, string topic)
    {

        var postIds = await context.usercomments
            .Where(c => c.iscaption == true && (c.comment.Contains("#"+topic + " ") || c.comment.Contains("#"+topic + ",") || c.comment.Contains("#"+topic + "#")))
            .Select(c => c.postid)
            .ToListAsync();

        return postIds;
    }

    public async Task<List<CommentLikeInfo>> GetNumLikesAndIsLikedByUserAndIsLikedByPostAuthorForPostComments(
    [Service] MegaDbContext context, string postid, string username, List<string> postAuthors)
    {
        var numLikesOfPostComments = await context.commentlikers
            .Where(c => c.postid == postid)
            .GroupBy(c => c.commentid)
            .Select(g => new { commentId = g.Key, count = g.Count() })
            .ToListAsync();


        var userLikedComments = await context.commentlikers
            .Where(c => c.postid == postid && c.username == username)
            .Select(c => c.commentid)
            .ToListAsync();

        var postAuthorLikedComments =  await context.commentlikers
            .Where(c => c.postid == postid && postAuthors.Contains(c.username))
            .Select(c => c.commentid)
            .ToListAsync();

        var result = numLikesOfPostComments.Select(elem => new CommentLikeInfo
        {
            commentId = elem.commentId,
            numLikes = elem.count,
            isLikedByUser = userLikedComments.Contains(elem.commentId),
            isLikedByPostAuthor = postAuthorLikedComments.Contains(elem.commentId)
        }).ToList();

        return result;
    }

    public class CommentLikeInfo
    {
        public string commentId { get; set; }
        public int numLikes { get; set; }
        public bool isLikedByUser { get; set; }
        public bool isLikedByPostAuthor { get; set; }
    }



}