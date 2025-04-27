using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace aspNetCoreBackend1.Models.SqlServer.Comment;

[Table("unencryptedCommentsOfPosts")]
public class UnencryptedCommentOfPost
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

    [Column("authorId")]
    public int authorId { get; set; }

    [Column("content")]
    public string content { get; set; }


    public UnencryptedCommentOfPost(
        string overallPostId, int? parentCommentId, bool isEdited, DateTime datetime, int authorId, string content
    )
    {
        this.overallPostId = overallPostId;
        this.parentCommentId = parentCommentId;
        this.isEdited = isEdited;
        this.datetime = datetime;
        this.authorId = authorId;
        this.content = content;
    }
}