namespace aspNetCoreBackend1.graphql.Types;

public class CommentWithInDepthInfo
{
    public int id { get; set; }

    public string overallPostId { get; set; }

    public int? parentCommentId { get; set; }

    public bool isEdited { get; set; }
    
    public DateTime datetime { get; set; }

    public string content { get; set; }

    public int authorId { get; set; }

    public string authorUsername { get; set; }

    public string authorStatus { get; set; }
    
    bool isLikedByPostAuthor { get; set; }

    bool isLikedByAuthUser { get; set; }

    public int numLikes { get; set; }

    public int numReplies { get; set; }


    public CommentWithInDepthInfo(
        int id, string overallPostId, int? parentCommentId, bool isEdited, DateTime datetime, string content, int authorId,
        string authorUsername, string authorStatus, bool isLikedByPostAuthor, bool isLikedByAuthUser, int numLikes,
        int numReplies
    )
    {
        this.id = id;
        this.overallPostId = overallPostId;
        this.parentCommentId = parentCommentId;
        this.isEdited = isEdited;
        this.datetime = datetime;
        this.content = content;
        this.authorId = authorId;
        this.authorUsername = authorUsername;
        this.authorStatus = authorStatus;
        this.isLikedByPostAuthor = isLikedByPostAuthor;
        this.isLikedByAuthUser = isLikedByAuthUser;
        this.numLikes = numLikes;
        this.numReplies = numReplies;
    }
}