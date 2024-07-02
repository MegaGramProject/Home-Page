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
}
