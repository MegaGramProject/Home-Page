using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace aspNetCoreBackend1.Models.Postgres.PostOrCommentLike;


[Table("encrypted_post_or_comment_likes")]
public class EncryptedPostOrCommentLike
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id { get; set; }

    [Column("overall_post_id")]
    public string? overallPostId { get; set; }

    [Column("comment_id")]
    public int? commentId { get; set; }

    [Column("encrypted_liker_id")]
    public byte[] encryptedLikerId { get; set; }

    [Column("encryption_iv")]
    public byte[] encryptionIv { get; set; }

    [Column("encryption_auth_tag")]
    public byte[] encryptionAuthTag { get; set; }
    
    [Column("datetime_of_like")]
    public DateTime datetimeOfLike { get; set; }

    public EncryptedPostOrCommentLike(
        string? overallPostId, int? commentId, byte[] encryptedLikerId, byte[] encryptionIv, byte[] encryptionAuthTag,
        DateTime datetimeOfLike
    )
    {
        this.overallPostId = overallPostId;
        this.commentId = commentId;
        this.encryptedLikerId = encryptedLikerId;
        this.encryptionIv = encryptionIv;
        this.encryptionAuthTag = encryptionAuthTag;
        this.datetimeOfLike = datetimeOfLike;
    }
}

