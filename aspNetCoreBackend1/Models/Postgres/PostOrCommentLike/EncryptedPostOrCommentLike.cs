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

    [Column("liker_id_encryption_iv")]
    public byte[] likerIdEncryptionIv { get; set; }

    [Column("liker_id_encryption_auth_tag")]
    public byte[] likerIdEncryptionAuthTag { get; set; }
    
    [Column("datetime")]
    public DateTime datetime { get; set; }

    public EncryptedPostOrCommentLike(
        string? overallPostId, int? commentId, byte[] encryptedLikerId, byte[] likerIdEncryptionIv, byte[] likerIdEncryptionAuthTag,
        DateTime datetime
    )
    {
        this.overallPostId = overallPostId;
        this.commentId = commentId;
        this.encryptedLikerId = encryptedLikerId;
        this.likerIdEncryptionIv = likerIdEncryptionIv;
        this.likerIdEncryptionAuthTag = likerIdEncryptionAuthTag;
        this.datetime = datetime;
    }
}

