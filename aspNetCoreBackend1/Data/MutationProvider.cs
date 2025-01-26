using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using HotChocolate;
using HotChocolate.Types;
using Megagram.Models;
using Microsoft.Extensions.ObjectPool;
using Microsoft.EntityFrameworkCore;

namespace Megagram.Data
{
    public class MutationProvider
    {
        public async Task<Comment> addComment ([Service] MegaDbContext dbContext, string commentid, string comment,
        DateTime datetime, bool isedited, string postid, string username)
        {
            var newComment = new Comment
            {
                commentid = commentid,
                comment = comment,
                datetime = datetime,
                isedited = isedited,
                postid = postid,
                username = username,

            };
            dbContext.usercomments.Add(newComment);
            await dbContext.SaveChangesAsync();
            return newComment;
        }

        public async Task<CommentLiker> addCommentLike ([Service] MegaDbContext dbContext, string commentid, string postid,
        string username)
        {
            var commentLike = new CommentLiker
            {
                commentid = commentid,
                postid = postid,
                username = username,

            };
            dbContext.commentlikers.Add(commentLike);
            await dbContext.SaveChangesAsync();
            return commentLike;
        }

        public async Task<Reply> addReply ([Service] MegaDbContext dbContext, string commentid, string replyid, string postid, string comment,
        DateTime datetime, bool isedited, string username)
        {
            var reply = new Reply
            {
                commentid = commentid,
                replyid = replyid,
                postid = postid,
                comment = comment,
                datetime = datetime,
                isedited = isedited,
                username = username,

            };
            dbContext.userreplies.Add(reply);
            await dbContext.SaveChangesAsync();
            return reply;
        }

        public async Task<bool> removeCommentLike ([Service] MegaDbContext dbContext, string commentid,
        string username)
        {
            var commentLike = await dbContext.commentlikers
            .FirstOrDefaultAsync(cl => cl.commentid == commentid && cl.username == username);

            if (commentLike != null)
            {
                dbContext.commentlikers.Remove(commentLike);
                await dbContext.SaveChangesAsync();
                return true;
            }

            return false;
        }

        public async Task<bool> removeComment ([Service] MegaDbContext dbContext, string commentid)
        {
            var comment = await dbContext.usercomments
            .FirstOrDefaultAsync(cl => cl.commentid == commentid);

            var replies = await dbContext.userreplies
            .Where(cl => cl.commentid == commentid)
            .ToListAsync();

            if (comment != null) {
                dbContext.userreplies.RemoveRange(replies);
                dbContext.usercomments.Remove(comment);
                await dbContext.SaveChangesAsync();
                return true;
            }
            return false;
        }

        public async Task<bool> removeReply ([Service] MegaDbContext dbContext, string replyid)
        {
            var reply = await dbContext.userreplies
            .FirstOrDefaultAsync(cl => cl.replyid == replyid);

            var repliesOfReply = await dbContext.userreplies
            .Where(cl => cl.commentid == replyid)
            .ToListAsync();

            if (reply != null)
            {
                dbContext.userreplies.Remove(reply);
                dbContext.userreplies.RemoveRange(repliesOfReply);
                await dbContext.SaveChangesAsync();
                return true;
            }

            return false;
        }

        public async Task<Comment> editComment ([Service] MegaDbContext dbContext, string commentid, DateTime datetime, string comment)
        {
            var editedComment = await dbContext.usercomments
            .FirstOrDefaultAsync(cl => cl.commentid == commentid);

            if (editedComment != null)
            {
                editedComment.datetime = datetime;
                editedComment.comment = comment;
                editedComment.isedited = true;
                await dbContext.SaveChangesAsync();
            }

            return editedComment!;
        }

        public async Task<Reply> editReply ([Service] MegaDbContext dbContext, string replyid, DateTime datetime, string comment)
        {
            var editedReply = await dbContext.userreplies
            .FirstOrDefaultAsync(cl => cl.replyid == replyid);

            if (editedReply != null)
            {
                editedReply.datetime = datetime;
                editedReply.comment = comment;
                editedReply.isedited = true;
                await dbContext.SaveChangesAsync();
            }

            return editedReply!;
        }
    }
}