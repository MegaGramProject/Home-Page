namespace aspNetCoreBackend1.graphql.Types;

public class CommentWithNumLikesAndNumReplies
{
    public int id { get; set; }

    public string overallPostId { get; set; }

    public int? parentCommentId { get; set; }

    public bool isEdited { get; set; }
    
    public DateTime datetimeOfComment { get; set; }

    public int authorId { get; set; }

    public string content { get; set; }

    public int numLikes { get; set; }

    public int numReplies { get; set; }

    public CommentWithNumLikesAndNumReplies(
        int id, string overallPostId, int? parentCommentId, bool isEdited, DateTime datetimeOfComment, int authorId,
        string content, int numLikes, int numReplies
    )
    {
        this.id = id;
        this.overallPostId = overallPostId;
        this.parentCommentId = parentCommentId;
        this.isEdited = isEdited;
        this.datetimeOfComment = datetimeOfComment;
        this.authorId = authorId;
        this.content = content;
        this.numLikes = numLikes;
        this.numReplies = numReplies;
    }
}