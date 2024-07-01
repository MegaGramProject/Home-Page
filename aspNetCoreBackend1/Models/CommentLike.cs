using System.ComponentModel.DataAnnotations;

namespace Megagram.Models;

public class CommentLike
{
    [Key]
    public string commentid { get; set; }
    public string username { get; set; }
    public string postid { get; set; }

}