using System.ComponentModel.DataAnnotations;

namespace Megagram.Models;

public class Comment
{
    [Key]
    public string commentId { get; set; }
    public string username { get; set; }
    public DateTime dateTime { get; set; }
    public Boolean isEdited { get; set; }
    public string comment { get; set; }
    public string postId { get; set; }

}