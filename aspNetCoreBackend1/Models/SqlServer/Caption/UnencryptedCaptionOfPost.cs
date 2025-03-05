using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace aspNetCoreBackend1.Models.SqlServer.Caption;


[Table("unencryptedCaptionsOfPosts")]
public class UnencryptedCaptionOfPost
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id { get; set; }

    [Column("overallPostId")]
    public string overallPostId { get; set; }

    [Column("isEdited")]
    public bool isEdited { get; set; }
    
    [Column("datetimeOfCaption")]
    public DateTime datetimeOfCaption { get; set; }

    [Column("authorId")]
    public int authorId { get; set; }

    [Column("content")]
    public string content { get; set; }

    public UnencryptedCaptionOfPost(
        string overallPostId, bool isEdited, DateTime datetimeOfCaption, int authorId, string content
    )
    {
        this.overallPostId = overallPostId;
        this.isEdited = isEdited;
        this.datetimeOfCaption = datetimeOfCaption;
        this.authorId = authorId;
        this.content = content;
    }
}