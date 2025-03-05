using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace aspNetCoreBackend1.Models.Postgres;

[Table("captions_comments_and_likes_encryption_info")]
public class CaptionCommentAndLikeEncryptionInfo {
    [Key]
    [Column("overall_post_id")]
    public string? overallPostId { get; set; }

    [Column("encrypted_data_encryption_key")]
    public byte[] encryptedDataEncryptionKey { get; set; }

    public CaptionCommentAndLikeEncryptionInfo(string? overallPostId, byte[] encryptedDataEncryptionKey)
    {
        this.overallPostId = overallPostId;
        this.encryptedDataEncryptionKey = encryptedDataEncryptionKey;
    }
}