namespace Megagram.Data;

using Megagram.Models;
using Microsoft.EntityFrameworkCore;

public class MegaDbContext : DbContext
{
    public DbSet<Comment> usercomments { get; set; }

    public DbSet<Reply> userreplies { get; set; }
    public DbSet<CommentLiker> commentlikers { get; set; }

    public MegaDbContext(DbContextOptions<MegaDbContext> options) : base(options)
    {
    }


}