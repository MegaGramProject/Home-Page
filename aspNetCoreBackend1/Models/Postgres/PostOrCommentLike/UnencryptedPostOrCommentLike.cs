using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace aspNetCoreBackend1.Models.Postgres.PostOrCommentLike;


[Table("unencrypted_post_or_comment_likes")]
[Index(nameof(overallPostId), nameof(likerId), IsUnique = true)]
[Index(nameof(commentId), nameof(likerId), IsUnique = true)]
public class UnencryptedPostOrCommentLike
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id { get; set; }

    [Column("overall_post_id")]
    public string? overallPostId { get; set; }

    [Column("comment_id")]
    public int? commentId { get; set; }

    [Column("liker_id")]
    public int likerId { get; set; }

    [Column("datetime")]
    public DateTime datetime { get; set; }

    public UnencryptedPostOrCommentLike(string? overallPostId, int? commentId, int likerId, DateTime datetime)
    {
        this.overallPostId = overallPostId;
        this.commentId = commentId;
        this.likerId = likerId;
        this.datetime = datetime;
    }
}

