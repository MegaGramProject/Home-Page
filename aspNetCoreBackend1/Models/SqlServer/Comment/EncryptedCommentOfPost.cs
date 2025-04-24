using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace aspNetCoreBackend1.Models.SqlServer.Comment;

[Table("encryptedCommentsOfPosts")]
public class EncryptedCommentOfPost
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id { get; set; }

    [Column("overallPostId")]
    public string overallPostId { get; set; }

    [Column("parentCommentId")]
    public int? parentCommentId { get; set; }

    [Column("isEdited")]
    public bool isEdited { get; set; }
    
    [Column("datetime")]
    public DateTime datetime { get; set; }

    [Column("encryptedAuthorId")]
    public byte[] encryptedAuthorId { get; set; }

    [Column("authorIdEncryptionIv")]
    public byte[] authorIdEncryptionIv { get; set; }

    [Column("authorIdEncryptionAuthTag")]
    public byte[] authorIdEncryptionAuthTag { get; set; }

    [Column("encryptedContent")]
    public byte[] encryptedContent { get; set; }

    [Column("contentEncryptionIv")]
    public byte[] contentEncryptionIv { get; set; }

    [Column("encryptionAuthTag")]
    public byte[] contentEncryptionAuthTag { get; set; }


    public EncryptedCommentOfPost(
        string overallPostId, int? parentCommentId, bool isEdited, DateTime datetime, byte[] encryptedAuthorId,
        byte[] authorIdEncryptionIv, byte[] authorIdEncryptionAuthTag, byte[] encryptedContent, byte[] contentEncryptionIv,
        byte[] contentEncryptionAuthTag
    )
    {
        this.overallPostId = overallPostId;
        this.parentCommentId = parentCommentId;
        this.isEdited = isEdited;
        this.datetime = datetime;
        this.encryptedAuthorId = encryptedAuthorId;
        this.authorIdEncryptionIv = authorIdEncryptionIv;
        this.authorIdEncryptionAuthTag = authorIdEncryptionAuthTag;
        this.encryptedContent = encryptedContent;
        this.contentEncryptionIv = contentEncryptionIv;
        this.contentEncryptionAuthTag = contentEncryptionAuthTag;
    }
}