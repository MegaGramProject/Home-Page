using Microsoft.EntityFrameworkCore;
using aspNetCoreBackend1.Models.Postgres;
using aspNetCoreBackend1.Models.Postgres.PostOrCommentLike;

namespace aspNetCoreBackend1.Contexts;

public class PostgresContext : DbContext
{
    public DbSet<UnencryptedPostOrCommentLike> unencryptedPostOrCommentLikes { get; set; }
    public DbSet<EncryptedPostOrCommentLike> encryptedPostOrCommentLikes { get; set; }
    public DbSet<CaptionCommentAndLikeEncryptionInfo> captionsCommentsAndLikesEncryptionInfo { get; set; }

    public PostgresContext(DbContextOptions<PostgresContext> options) : base(options)
    {
    }
}

