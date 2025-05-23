using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace aspNetCoreBackend1.Models.SqlServer.Caption;


[Table("unencryptedCaptionsOfPosts")]
public class UnencryptedCaptionOfPost
{
    [Key]
    [Column("overallPostId")]
    public string overallPostId { get; set; }

    [Column("isEdited")]
    public bool isEdited { get; set; }
    
    [Column("datetime")]
    public DateTime datetime { get; set; }

    [Column("authorId")]
    public int authorId { get; set; }

    [Column("content")]
    public string content { get; set; }


    public UnencryptedCaptionOfPost()
    {}


    public UnencryptedCaptionOfPost(
        string overallPostId, bool isEdited, DateTime datetime, int authorId, string content
    )
    {
        this.overallPostId = overallPostId;
        this.isEdited = isEdited;
        this.datetime = datetime;
        this.authorId = authorId;
        this.content = content;
    }
}