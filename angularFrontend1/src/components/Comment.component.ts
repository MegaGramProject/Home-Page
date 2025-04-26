import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';


@Component({
  selector: 'Comment',
  templateUrl: '../templates/Comment.component.html',
  imports: [CommonModule],
  standalone: true
})
export class Comment {
  @Input() id!:number;

  @Input() authUserId!:number;
  @Input() isLikedByAuthUser!:boolean;
  @Input() newlyPostedRepliesByAuthUser!:any[];

  @Input() authorId!:number;
  @Input() authorUsername!:string;
  @Input() authorIsVerified!:boolean;
  @Input() authorPfp!:string;
  @Input() authorStatusToAuthUser!:string;

  @Input() isEdited!:boolean;
  @Input() datetime!:string;
  @Input() content!:string;
  @Input() isLikedByPostAuthor!:boolean;

  @Input() numLikes!:number;
  @Input() numReplies!:number;

  @Input() usersAndTheirRelevantInfo!:any;

  @Output() showErrorPopup:EventEmitter<string> = new EventEmitter<string>();

  @Output() updateCommentDetails:EventEmitter<{ id: number, isLikedByAuthUser: boolean, numLikes: number }> =
  new EventEmitter<{ id: number, isLikedByAuthUser: boolean, numLikes: number }>();

  @Output() replyToComment:EventEmitter<{ id: number, authorUsername: string, content: string }> =
  new EventEmitter<{ id: number, authorUsername: string, content: string }>();

  @Output() showLikersPopup:EventEmitter<number> = new EventEmitter<number>();
  @Output() fetchAllTheNecessaryInfo:EventEmitter<any[]> = new EventEmitter<any[]>();
  
  @Output() notifyParentToEditComment:EventEmitter<{ id: number, newComment: string }> =
  new EventEmitter<{ id: number, newComment: string }>();

  @Output() notifyParentToDeleteComment:EventEmitter<number> = new EventEmitter<number>();

  isCaption:boolean = false;
  displayReplies:boolean = false;

  editMode:boolean = false;
  editCommentInput:string = '';

  newRepliesToThisCommentByAuthUser:any[] = [];
  fetchedListOfReplies:any[] = [];
  replyIdsToExclude:number[] = [];

  elementsForCommentContent:{ type: string, text?: string, href?: string }[] = [];

  isCurrentlyFetchingReplies:boolean = false;


  ngOnInit() {
    this.isCaption = this.authorStatusToAuthUser === 'Caption';

    this.finishSettingElementsForCommentContent();

    let newNewRepliesToThisCommentByAuthUser = this.newlyPostedRepliesByAuthUser
    .filter(newlyPostedAuthUserReply => this.id === newlyPostedAuthUserReply.parentCommentId);

    this.newRepliesToThisCommentByAuthUser = newNewRepliesToThisCommentByAuthUser;
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes['content']) {
      this.finishSettingElementsForCommentContent();
    }

    if (changes['newlyPostedRepliesByAuthUser']) {
      let newNewRepliesToThisCommentByAuthUser = this.newlyPostedRepliesByAuthUser
      .filter(newlyPostedAuthUserReply => this.id === newlyPostedAuthUserReply.parentCommentId);

      if (newNewRepliesToThisCommentByAuthUser.length > this.newRepliesToThisCommentByAuthUser.length) {
        this.displayReplies = true;
      } 

      this.newRepliesToThisCommentByAuthUser = newNewRepliesToThisCommentByAuthUser;
    }
  }


  finishSettingElementsForCommentContent() {
    const newElementsForCommentContent:{ type: string, text?: string, href?: string }[] = [
      { type: 'span', text: ' ' }
    ];

    let contentValue = this.content;

    while (contentValue.length > 0) {
      const indexOfNextAtSymbol = contentValue.indexOf('@');
      const indexOfNextHashtag = contentValue.indexOf('#');

      if (indexOfNextAtSymbol === -1 && indexOfNextHashtag === -1) {
        newElementsForCommentContent.push({ type: 'span', text: contentValue });
        break;
      }
      else if (indexOfNextAtSymbol === -1 || (indexOfNextHashtag !== -1 && indexOfNextHashtag < indexOfNextAtSymbol)) {
        newElementsForCommentContent.push({
          type: 'span',
          text: contentValue.substring(0, indexOfNextHashtag)
        });

        contentValue = contentValue.substring(indexOfNextHashtag);
        let indexOfSpaceAfterHashtagUsed = contentValue.indexOf(' ');

        if (indexOfSpaceAfterHashtagUsed === -1)
          indexOfSpaceAfterHashtagUsed = contentValue.length;

        const hashtagUsed = contentValue.substring(0, indexOfSpaceAfterHashtagUsed);
        newElementsForCommentContent.push({
          type: 'a',
          text: hashtagUsed,
          href: `http://34.111.89.101/search/tags/${hashtagUsed.substring(1)}`
        });

        contentValue = contentValue.substring(indexOfSpaceAfterHashtagUsed);
      }
      else {
        newElementsForCommentContent.push({
          type: 'span',
          text: contentValue.substring(0, indexOfNextAtSymbol)
        });

        contentValue = contentValue.substring(indexOfNextAtSymbol);
        let indexOfSpaceAfterMentionedUsername = contentValue.indexOf(' ');

        if (indexOfSpaceAfterMentionedUsername === -1)
          indexOfSpaceAfterMentionedUsername = contentValue.length;

        const mentionedUsername = contentValue.substring(0, indexOfSpaceAfterMentionedUsername);
        newElementsForCommentContent.push({
          type: 'a',
          text: mentionedUsername,
          href: `http://34.111.89.101/profile/${mentionedUsername.substring(1)}`
        });

        contentValue = contentValue.substring(indexOfSpaceAfterMentionedUsername);
      }
    }

    this.elementsForCommentContent = newElementsForCommentContent;
  }


  toggleDisplayReplies() {
    if(!this.displayReplies && this.fetchedListOfReplies.length == 0) {
      this.fetchBatchOfAdditionalReplies();
    }

    this.displayReplies = !this.displayReplies;
  }


  toggleEditMode() {
    this.editCommentInput = '';
    this.editMode = !this.editMode;
  }


  updateEditCommentInput(event:any) {
    this.editCommentInput = event.target.value;
  }


  async toggleLikeComment() {
    if (this.authUserId == -1) {
      this.showErrorPopup.emit('Dear Anonymous Guest, you must be logged into an account to like comments');
      return;
    }

    if(!this.isLikedByAuthUser) {
      this.likeComment();
    }
    else {
      try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/removeLikeFromPostOrComment/${this.authUserId}
        /${this.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if(!response.ok) {
          this.showErrorPopup.emit('The server had trouble removing your like of this comment');
        }
        else {
          this.updateCommentDetails.emit({
            id: this.id,
            isLikedByAuthUser: false,
            numLikes: this.numLikes - 1
          });
        }
      }
      catch (error) {
        this.showErrorPopup.emit(
          'There was trouble connecting to the server to remove your like of this comment'
        );
      }
    }
  }


  async likeComment() {
    if (this.authUserId == -1) {
      this.showErrorPopup.emit('Dear Anonymous Guest, you must be logged into an account to like comments');
      return;
    }

    if(!this.isLikedByAuthUser) {
      try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/addLikeToPostOrComment/${this.authUserId}/${this.id}`, {
            method: 'POST',
            credentials: 'include'
        });
        if(!response.ok) {
          this.showErrorPopup.emit('The server had trouble adding your like to this comment');
        }
        else {
          this.updateCommentDetails.emit({
            id: this.id,
            isLikedByAuthUser: true,
            numLikes: this.numLikes + 1
          });
        }
      }
      catch (error) {
        this.showErrorPopup.emit(
          'There was trouble connecting to the server to add your like to this comment'
        );
      }
    }
  }


  async editComment() {
    try {
      const response = await fetch(
      "http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          query: `mutation ($authUserId: Int!, $commentId: Int!, $newCommentContent: String!) {
            editComment(authUserId: $authUserId, commentId: $commentId, newCommentContent: $newCommentContent)
          }`,
          variables: {
            authUserId: this.authUserId,
            commentId: this.id,
            newCommentContent: this.editCommentInput
          }
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        this.showErrorPopup.emit(
          'The server had trouble updating your comment'
        );
      }
      else {
        this.notifyParentToEditComment.emit({
          id: this.id,
          newComment: this.editCommentInput
        });
        this.toggleEditMode();
      }
    }
    catch (error) {
      this.showErrorPopup.emit(
        'There was trouble connecting to the server to update your comment'
			);
    }
  }


  async deleteComment() {
    try {
      const response = await fetch(
      "http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          query: `mutation ($authUserId: Int!, $commentId: Int!) {
            deleteComment(authUserId: $authUserId, commentId: $commentId)
          }`,
          variables: {
            authUserId: this.authUserId,
            commentId: this.id
          }
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        this.showErrorPopup.emit(
          'The server had trouble deleting your comment'
        );
      }
      else {
        this.notifyParentToDeleteComment.emit(this.id);
      }
    }
    catch (error) {
      this.showErrorPopup.emit(
        'There was trouble connecting to the server to delete your comment'
      );
    }
  }


  async fetchBatchOfAdditionalReplies() {
    if (this.isCurrentlyFetchingReplies) {
      return;
    }

    this.isCurrentlyFetchingReplies = true;

    try {
      const response = await fetch(
      "http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          query: `query ($authUserId: Int!, $commentId: Int!, replyIdsToExclude: [Int!]!, maxBatchSize: Int!) {
            getBatchOfRepliesOfComment(
              authUserId: $authUserId, commentId: $commentId, replyIdsToExclude: $replyIdsToExclude, maxBatchSize: $maxBatchSize
            )
          }`,
          variables: {
            authUserId: this.authUserId,
            commentId: this.id,
            replyIdsToExclude: this.replyIdsToExclude,
            maxBatchSize: this.numReplies - this.fetchedListOfReplies.length - this.newRepliesToThisCommentByAuthUser.length
          }
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        this.showErrorPopup.emit('The server had trouble getting additional replies of this comment.');
      }
      else {
        let repliesOfComment = await response.json();
        repliesOfComment = repliesOfComment.data.getBatchOfRepliesOfComment;

        this.fetchAllTheNecessaryInfo.emit(repliesOfComment);
        let newFetchedListOfReplies = [...repliesOfComment, ...this.fetchedListOfReplies];
        this.fetchedListOfReplies = newFetchedListOfReplies;

        let newReplyIdsToExclude = [...this.replyIdsToExclude];
        for(let replyOfComment of repliesOfComment) {
          newReplyIdsToExclude.push(replyOfComment.id);
        }
        this.replyIdsToExclude = newReplyIdsToExclude;
      }
    }
    catch (error) {
      this.showErrorPopup.emit(
        'There was trouble connecting to the server to get additional replies of this comment.'
      );
    }

    this.isCurrentlyFetchingReplies = false;
  }
}