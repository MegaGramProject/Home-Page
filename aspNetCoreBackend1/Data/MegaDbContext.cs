namespace Megagram.Data;

using Megagram.Models;
using Microsoft.EntityFrameworkCore;

public class MegaDbContext : DbContext
{
    public DbSet<Comment> usercomments { get; set; }

    public DbSet<Reply> userreplies { get; set; }
    public DbSet<CommentLiker> commentlikers { get; set; }

    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<CommentLiker>()
                .HasKey(cl => new { cl.commentid, cl.username });
        }

    public MegaDbContext(DbContextOptions<MegaDbContext> options) : base(options)
    {
    }


}