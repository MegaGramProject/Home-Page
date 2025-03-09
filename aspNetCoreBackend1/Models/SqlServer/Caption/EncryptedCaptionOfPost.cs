using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace aspNetCoreBackend1.Models.SqlServer.Caption;


[Table("encryptedCaptionsOfPosts")]
public class EncryptedCaptionOfPost
{
    
    [Key]
    [Column("overallPostId")]
    public string overallPostId { get; set; }

    [Column("isEdited")]
    public bool isEdited { get; set; }
    
    [Column("datetimeOfCaption")]
    public DateTime datetimeOfCaption { get; set; }

    [Column("encryptedAuthorId")]
    public byte[] encryptedAuthorId { get; set; }

    [Column("encryptedContent")]
    public byte[] encryptedContent { get; set; }
    
    [Column("encryptionIv")]
    public byte[] encryptionIv { get; set; }

    [Column("encryptionAuthTag")]
    public byte[] encryptionAuthTag { get; set; }

    public EncryptedCaptionOfPost(
        string overallPostId, bool isEdited, DateTime datetimeOfCaption, byte[] encryptedAuthorId, byte[]
        encryptedContent, byte[] encryptionIv, byte[] encryptionAuthTag
    )
    {
        this.overallPostId = overallPostId;
        this.isEdited = isEdited;
        this.datetimeOfCaption = datetimeOfCaption;
        this.encryptedAuthorId = encryptedAuthorId;
        this.encryptedContent = encryptedContent;
        this.encryptionIv = encryptionIv;
        this.encryptionAuthTag = encryptionAuthTag;
    }
}