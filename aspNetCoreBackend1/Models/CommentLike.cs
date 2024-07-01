using System.ComponentModel.DataAnnotations;

namespace Megagram.Models;

public class CommentLike
{
    [Key]
    public string commentId { get; set; }
    public string username { get; set; }

}