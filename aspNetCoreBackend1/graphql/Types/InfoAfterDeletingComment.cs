namespace aspNetCoreBackend1.graphql.Types;

public class InfoAfterDeletingComment
{   
    public int totalNumberOfLikesOfCommentDeleted { get; set; }
    public int totalNumberOfRepliesDeleted { get; set; }
    public int totalNumberOfLikesOfRepliesDeleted { get; set; }

    public InfoAfterDeletingComment(
        int totalNumberOfLikesOfCommentDeleted, int totalNumberOfRepliesDeleted, int totalNumberOfLikesOfRepliesDeleted
    )
    {
        this.totalNumberOfLikesOfCommentDeleted = totalNumberOfLikesOfCommentDeleted;
        this.totalNumberOfRepliesDeleted = totalNumberOfRepliesDeleted;
        this.totalNumberOfLikesOfRepliesDeleted = totalNumberOfLikesOfRepliesDeleted;
    }
}