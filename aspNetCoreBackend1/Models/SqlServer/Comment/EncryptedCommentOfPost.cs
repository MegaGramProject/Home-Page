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
    
    [Column("datetimeOfComment")]
    public DateTime datetimeOfComment { get; set; }

    [Column("encryptedAuthorId")]
    public byte[] encryptedAuthorId { get; set; }

    [Column("encryptedContent")]
    public byte[] encryptedContent { get; set; }

    [Column("encryptionIv")]
    public byte[] encryptionIv { get; set; }

    [Column("encryptionAuthTag")]
    public byte[] encryptionAuthTag { get; set; }

    public EncryptedCommentOfPost(
        string overallPostId, int? parentCommentId, bool isEdited, DateTime datetimeOfComment, byte[] encryptedAuthorId,
        byte[] encryptedContent, byte[] encryptionIv, byte[] encryptionAuthTag
    )
    {
        this.overallPostId = overallPostId;
        this.parentCommentId = parentCommentId;
        this.isEdited = isEdited;
        this.datetimeOfComment = datetimeOfComment;
        this.encryptedAuthorId = encryptedAuthorId;
        this.encryptedContent = encryptedContent;
        this.encryptionIv = encryptionIv;
        this.encryptionAuthTag = encryptionAuthTag;
    }
}