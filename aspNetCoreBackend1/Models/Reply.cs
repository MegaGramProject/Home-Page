using System.ComponentModel.DataAnnotations;

namespace Megagram.Models;

public class Reply
{
    [Key]
    public string replyid { get; set; }
    public string commentid { get; set; }
    public string username { get; set; }
    public DateTime datetime { get; set; }
    public Boolean isedited { get; set; }
    public string comment { get; set; }
    public string postid { get; set; }
    
}