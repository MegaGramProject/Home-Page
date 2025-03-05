using Microsoft.EntityFrameworkCore;
using aspNetCoreBackend1.Models.SqlServer.Caption;
using aspNetCoreBackend1.Models.SqlServer.Comment;

namespace aspNetCoreBackend1.Contexts;

public class SqlServerContext : DbContext
{
    public DbSet<UnencryptedCaptionOfPost> unencryptedCaptionsOfPosts { get; set; }
    public DbSet<EncryptedCaptionOfPost> encryptedCaptionsOfPosts { get; set; }
    public DbSet<UnencryptedCommentOfPost> unencryptedCommentsOfPosts { get; set; }
    public DbSet<EncryptedCommentOfPost> encryptedCommentsOfPosts { get; set; }

    public SqlServerContext(DbContextOptions<PostgresContext> options) : base(options)
    {
    }
}

