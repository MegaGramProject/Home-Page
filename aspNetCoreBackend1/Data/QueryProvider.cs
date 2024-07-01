using Megagram.Models;

namespace Megagram.Data;

public class QueryProvider
{
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Comment> GetComments([Service] MegaDbContext context) => context.usercomments;

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Reply> GetReplies([Service] MegaDbContext context) => context.userreplies;

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<CommentLike> GetCommentLikes([Service] MegaDbContext context) => context.commentlikes;
}