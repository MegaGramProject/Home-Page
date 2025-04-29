import { Comment } from '../components/Comment.component';
import { Footer } from '../components/Footer.component';
import { LeftSidebar } from '../components/LeftSidebar.component';
import { MediaPost } from '../components/MediaPost.component';
import { StoryViewer } from '../components/StoryViewer.component';
import { UserBar } from '../components/UserBar.component';
import { UserIcon } from '../components/UserIcon.component';

import { AboutAccountPopup } from '../components/Popups/AboutAccountPopup.component';
import { CommentsPopup } from '../components/Popups/CommentsPopup.component';
import { ErrorPopup } from '../components/Popups/ErrorPopup.component';
import { LeftSidebarPopup } from '../components/Popups/LeftSidebarPopup.component';
import { LikersPopup } from '../components/Popups/LikersPopup.component';
import { SendPostPopup } from '../components/Popups/SendPostPopup.component';
import { ThreeDotsPopup } from '../components/Popups/ThreeDotsPopup.component';

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BehaviorSubject } from 'rxjs';
import { UserNotification } from '../components/UserNotification.component';

import * as signalR from '@microsoft/signalr';
import { io } from "socket.io-client";


@Component({
  selector: 'HomePage',
  standalone: true,
  imports: [
    CommonModule, LeftSidebar, LeftSidebarPopup, Footer, ErrorPopup, ThreeDotsPopup, UserIcon, AboutAccountPopup, UserBar,
    LikersPopup, SendPostPopup, StoryViewer, Comment, MediaPost, CommentsPopup, UserNotification
  ],
  templateUrl: './HomePage.component.html',
  styleUrl: '../styles.css'
})
export class HomePage {
  authUserId:number = 1;
  authUserIdBS:BehaviorSubject<number> = new BehaviorSubject<number>(-1);
  authUsername:string = '';
  authUsernameBS:BehaviorSubject<string> = new BehaviorSubject<string>('');

  originalURL:string = '';
  numTimesRouteParamsWasWatched:number = 0;

  displayLeftSidebarPopup:boolean = false;

  displayErrorPopup:boolean = false;
  errorPopupMessage:string = '';

  displayThreeDotsPopup:boolean = false;
  threeDotsPopupPostDetails:any = {};

  displayAboutAccountPopup:boolean = false;
  aboutAccountUsername:string = '';
  aboutAccountUserId:number  = -1;
  aboutAccountUserIsVerified:boolean = false;
  aboutAccountUserHasStories:boolean = false;
  aboutAccountUserHasUnseenStory:boolean = false;
  aboutAccountUserProfilePhoto:string|null = null;

  displayLikersPopup:boolean = false;
  likersPopupIdOfPostOrComment:string|number = '';

  displaySendPostPopup:boolean = false;
  sendPostPopupOverallPostId:string = '';

  displayCommentsPopup:boolean = false;
  commentsPopupPostDetails:any = {};
  commentsPopupCurrSlide:number = -1;

  displayStoryViewer:boolean = false;
  currStoryLevel:number = 0;
  storyViewerIsFromStoriesSection:boolean = false;
  storyViewerMainUserId:number = -1;
  storyViewerMainUsername:string = '';
  orderedListOfUserIdsInStoriesSection:number[] = [];
  orderedListOfUsernamesInStoriesSection:string[] = [];
  orderedListOfSponsorshipStatusesInStoriesSection:boolean[] = [];
  fetchingStoriesIsComplete:boolean = false;
  storiesSectionErrorMessage:string = '';
  usernamesWhoseStoriesYouHaveFinished:Set<string> = new Set();
  usersAndTheirStories:any = {};
  usersAndTheirStoryPreviews:any = {};
  usersAndYourCurrSlideInTheirStories:any = {};
  vidStoriesAndTheirPreviewImages:any = {};

  usersAndTheirRelevantInfo:any = {};
  postsAndTheirPreviewImgs:any = {};

  cachedMessageSendingSuggestions:any = {};

  orderedListOfPosts:Array<any> = [];
  focusedMediaPostId:string = '';

  orderedListOfNotifications:{ leftImage: any, rightImage: any, description: string, leftImageLink: string,
  entireNotificationLink: string }[] = [];
  

  constructor(private route: ActivatedRoute) { }


  ngOnInit() {
    document.title = "Megagram";
    this.originalURL = window.location.href;


    this.authUserIdBS.subscribe(newAuthUserId => {
      this.authUserId = newAuthUserId;

      localStorage.setItem('defaultUserId', newAuthUserId.toString());

      if (newAuthUserId !== -1) {
        this.establishCollaborationWithNodeJSWebSocketDotIO();
        this.establishCollaborationWithCSharpSignalRWebSocket();
        this.establishCollaborationWithPhpRatchetWebSocket();
        this.establishCollaborationWithPythonWebSocket();
      }
    });


    this.authUsernameBS.subscribe(newAuthUsername => {
      this.authUsername = newAuthUsername;

      if (newAuthUsername.length > 0) {
        localStorage.setItem('defaultUsername', newAuthUsername);
        this.fetchStories();
        this.fetchSuggestedAccounts();
        this.fetchPosts('initial');
      }
    });


    const authUsernameFromRouteParams = this.route.snapshot.paramMap.get('authUsername');
    if(authUsernameFromRouteParams !== null && localStorage.getItem('defaultUsername') !== authUsernameFromRouteParams) {
      this.authenticateUser(authUsernameFromRouteParams, null);
    }
    else if(localStorage.getItem('defaultUsername')) {
      if (localStorage.getItem('defaultUsername') === 'Anonymous Guest') {
        this.authUsernameBS.next('Anonymous Guest');
      }
      else {
        this.authenticateUser(
          localStorage.getItem('defaultUsername')!,
          parseInt(localStorage.getItem('defaultUserId')!)
        );
      }
    }
    else {
      this.authUsernameBS.next('Anonymous Guest');
    }
  }


  async authenticateUser(username:string , userId:number|null) {
    if (userId == null) {
      try {
        const response = await fetch('http://34.111.89.101/api/Home-Page/laravelBackend1/graphql', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            query: `query getUserIdOfUsername($username: String!) {
              getUserIdOfUsername(username: $username)
            }`,
            variables: {
              username: username
            }
          })
        });
        if (!response.ok) {
          this.authUsernameBS.next('Anonymous Guest');
          
          throw new Error(
            `The laravelBackend1 server had trouble getting the user-id of username ${username}`
          );
        }
        
        const responseData:any = await response.json();
        userId = responseData.data.getUserIdOfUsername;
        this.authUserIdBS.next(userId!);
      }
      catch {
        this.authUsernameBS.next('Anonymous Guest');

        throw new Error(
          `There was trouble connecting to the laravelBackend1 server to get the user-id of username ${username}`
        );
      }
    }
    else {
      this.authUserIdBS.next(userId);
    }

    try {
      const response1 = await fetch(`http://34.111.89.101/api/Home-Page/expressJSBackend1/authenticateUser
      /${userId}`, { credentials: 'include' });
      if (!response1.ok) {
        this.authUsernameBS.next('Anonymous Guest');
        this.authUserIdBS.next(-1);

        throw new Error(
          `The expressJSBackend1 server had trouble verifying you as having the proper credentials to be 
          logged in as user ${userId}`
        );
      }

      this.authUsernameBS.next(username);
    }
    catch {
      this.authUsernameBS.next('Anonymous Guest');
      this.authUserIdBS.next(-1);

      throw new Error(
        `There was trouble connecting to the expressJSBackend1 server to verify you as having the proper
        credentials to be logged in as user ${userId}`
      );
    }
  }


  async fetchStories() {

  }


  async fetchSuggestedAccounts() {

  }


  async fetchPosts(initialOrAdditionalText:string) {
    initialOrAdditionalText;
  }


  hidePost() {
    this.orderedListOfPosts = this.orderedListOfPosts.filter(
        postDetails => (postDetails.overallPostId !== this.threeDotsPopupPostDetails.overallPostId)
    );
    this.displayThreeDotsPopup = false;
    this.displayCommentsPopup = false;
  }


  updateUsersAndTheirRelevantInfo(newUsersAndTheirRelevantInfo:any) {
    this.usersAndTheirRelevantInfo = newUsersAndTheirRelevantInfo;
  }


  updateUsersAndTheirStories(newUsersAndTheirStories:any) {
    this.usersAndTheirStories = newUsersAndTheirStories;
  }


  updateUsersAndTheirStoryPreviews(newUsersAndTheirStoryPreviews:any) {
    this.usersAndTheirStoryPreviews = newUsersAndTheirStoryPreviews;
  }


  updateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories:any) {
    this.usersAndYourCurrSlideInTheirStories = newUsersAndYourCurrSlideInTheirStories;
  }


  updateVidStoriesAndTheirPreviewImages(newVidStoriesAndTheirPreviewImages:any) {
    this.vidStoriesAndTheirPreviewImages = newVidStoriesAndTheirPreviewImages;
  }


  updateCachedMessageSendingSuggestions(newCachedMessageSendingSuggestions:any) {
    this.cachedMessageSendingSuggestions = newCachedMessageSendingSuggestions;
  }


  showErrorPopup(newErrorPopupMessage:string) {
    this.errorPopupMessage = newErrorPopupMessage;
    this.displayErrorPopup = true;
  }


  showAboutAccountPopup(usernameAndIdInfo: { username: string; userId: number }) {
    const newAboutAccountUsername = usernameAndIdInfo.username;
    const newAboutAccountUserId = usernameAndIdInfo.userId;

    this.aboutAccountUsername = newAboutAccountUsername;

    this.aboutAccountUserIsVerified = 
      newAboutAccountUserId in this.usersAndTheirRelevantInfo &&
      'isVerified' in this.usersAndTheirRelevantInfo[newAboutAccountUserId]
      ? this.usersAndTheirRelevantInfo[newAboutAccountUserId].isVerified
      : false;

    this.aboutAccountUserHasStories = 
      newAboutAccountUserId in this.usersAndTheirRelevantInfo &&
      'hasStories' in this.usersAndTheirRelevantInfo[newAboutAccountUserId]
      ? this.usersAndTheirRelevantInfo[newAboutAccountUserId].hasStories
      : false;

    this.aboutAccountUserHasUnseenStory = 
      newAboutAccountUserId in this.usersAndTheirRelevantInfo &&
      'hasUnseenStory' in this.usersAndTheirRelevantInfo[newAboutAccountUserId]
      ? this.usersAndTheirRelevantInfo[newAboutAccountUserId].hasUnseenStory
      : false;

    this.aboutAccountUserProfilePhoto = 
      newAboutAccountUserId in this.usersAndTheirRelevantInfo &&
      'profilePhoto' in this.usersAndTheirRelevantInfo[newAboutAccountUserId]
      ? this.usersAndTheirRelevantInfo[newAboutAccountUserId].profilePhoto
      : 'images/defaultPfp.png';

    this.displayAboutAccountPopup = true;
  }


  showStoryViewer(relevantInfoForStoryViewer:{ newStoryViewerMainUserId: number, newStoryViewerMainUsername: string,
  newStoryViewerIsFromStoriesSection:boolean }) {
    document.title = 'Stories';

    this.storyViewerMainUserId = relevantInfoForStoryViewer.newStoryViewerMainUserId;
    this.storyViewerMainUsername = relevantInfoForStoryViewer.newStoryViewerMainUsername;
    this.storyViewerIsFromStoriesSection = relevantInfoForStoryViewer.newStoryViewerIsFromStoriesSection;
    this.displayStoryViewer = true;
  }

  showLikersPopup(newLikersPopupIdOfPostOrComment:string|number) {
    this.likersPopupIdOfPostOrComment = newLikersPopupIdOfPostOrComment;
    this.displayLikersPopup = true;
  }


  showSendPostPopup(newSendPostPopupOverallPostId:string) {
    this.sendPostPopupOverallPostId = newSendPostPopupOverallPostId;
    this.displaySendPostPopup = true;
  }


  showThreeDotsPopup(newThreeDotsPopupPostDetails:any) {
    this.threeDotsPopupPostDetails = newThreeDotsPopupPostDetails;
    this.displayThreeDotsPopup = true;
  }


  showCommentsPopup(infoForCommentsPopup:{ postDetails: any, currSlide: number }) {
    this.commentsPopupPostDetails = infoForCommentsPopup.postDetails;
    this.commentsPopupCurrSlide = infoForCommentsPopup.currSlide;

    this.displayCommentsPopup = true;
  }


  updatePostDetails(newPostDetails:{ overallPostId: string, isLiked?: boolean, numLikes?: number, numComments?:number, isSaved?:
  boolean }) {
    const newOrderedListOfPosts = [...this.orderedListOfPosts];

    for(let i=0; i<newOrderedListOfPosts.length; i++) {
      const postDetails = {...newOrderedListOfPosts[i]};
      if(postDetails.overallPostId === newPostDetails.overallPostId) {
        if (newPostDetails.isLiked !== null) {
          postDetails.isLiked = newPostDetails.isLiked;
        }
        if (newPostDetails.numLikes !== null) {
          postDetails.numLikes = newPostDetails.numLikes;
        }
        if (newPostDetails.numComments !== null) {
          postDetails.numComments = newPostDetails.numComments;
        }
        if (newPostDetails.isSaved !== null) {
          postDetails.isSaved = newPostDetails.isSaved;
        }

        newOrderedListOfPosts[i] = postDetails
        this.orderedListOfPosts = newOrderedListOfPosts;
        return;
      }
    }
  }


  updateFocusedMediaPost(newFocusedMediaPostId:string) {
    this.focusedMediaPostId = newFocusedMediaPostId;
  }


  toggleDisplayLeftSidebarPopup() {
    this.displayLeftSidebarPopup = !this.displayLeftSidebarPopup;
  }


  closeAllPopups() {
    if(!(this.displayCommentsPopup && (this.displayThreeDotsPopup || this.displayAboutAccountPopup ||
    this.displayErrorPopup || this.displayLikersPopup || this.displaySendPostPopup))) {
      this.displayCommentsPopup = false;
    }

    this.displayLeftSidebarPopup = false;
    this.displayErrorPopup = false;
    this.displayThreeDotsPopup = false;
    this.displayAboutAccountPopup = false;
    this.displayLikersPopup = false;
    this.displaySendPostPopup = false;
  }


  closeThreeDotsPopup() {
    this.displayThreeDotsPopup = false;
  }


  closeAboutAccountPopup() {
    this.displayAboutAccountPopup = false;
  }


  closeErrorPopup() {
    this.displayErrorPopup = false;
  }


  closeLikersPopup () {
    this.displayLikersPopup = false;
  }


  closeSendPostPopup() {
    this.displaySendPostPopup = false;
  }


  closeStoryViewer() {
    document.title = 'Megagram';

    this.displayStoryViewer = false;

    window.history.pushState(
      {
        page: 'Megagram',
      },
      'Megagram',
      this.originalURL
    );
  }


  closeCommentsPopup() {
    this.displayCommentsPopup = false;
  }


  deleteNotification(event:any) {
    if (event !== null) {
      event.preventDefault();
    }

    this.orderedListOfNotifications = [...this.orderedListOfNotifications.slice(1)]
  }


  notificationsTrackByFn(index: number, notification:{ leftImage: any, rightImage: any, description: string, leftImageLink:
  string, entireNotificationLink: string }) {
    return notification.description;
  }


  addRelevantInfoToUser(requiredInfo:{userId: number, userFieldsAndTheirValues:any}) {
    const { userId, userFieldsAndTheirValues }  = requiredInfo;
    if (!(userId in this.usersAndTheirRelevantInfo)) {
      this.usersAndTheirRelevantInfo[userId] = {};
    }

    for(let field of Object.keys(userFieldsAndTheirValues)) {
      this.usersAndTheirRelevantInfo[userId][field] = userFieldsAndTheirValues[field];
    }
  }


  addUsernameToSetOfUsersWhoseStoriesYouHaveFinished(newFinishedUsername: string) {
    this.usernamesWhoseStoriesYouHaveFinished = new Set(
      [
        ...this.usernamesWhoseStoriesYouHaveFinished,
        newFinishedUsername
      ]
    );
  }


  establishCollaborationWithNodeJSWebSocketDotIO() {
    const nodeJSWebSocketDotIO = io('http://34.111.89.101/socket/Home-Page/nodeJSWebSocketDotIO',
      {
        withCredentials: true, 
        query: {
          userId: this.authUserId,
          updatesToSubscribeTo: JSON.stringify(['post-likes', 'post-comments'])
        }
      }
    );


    nodeJSWebSocketDotIO.on('error', (_) => {
      console.error(`There was trouble with the nodeJSWebSocketDotIO connection, which is responsible
      for providing info for notifications of new post-likes and post-comments.`);
    });


    nodeJSWebSocketDotIO.on('NewLikeOfPost', async (data) => {
      const { likerId } = data;

      if (likerId == this.authUserId) {
        return;
      }

      if (!(likerId in this.usersAndTheirRelevantInfo) ||
      !('profilePhoto' in this.usersAndTheirRelevantInfo[likerId])) {
        await this.getProfilePhotoOfUser(likerId);
      }

      const { overallPostId, likerName } = data;


      if (!(overallPostId in this.postsAndTheirPreviewImgs)) {
        await this.getPreviewImageOfPost(overallPostId);
      }

      this.orderedListOfNotifications = [
        ...this.orderedListOfNotifications,
        {
          leftImage: this.usersAndTheirRelevantInfo[likerId]?.profilePhoto ?? 'images/defaultPfp.png',
          rightImage: this.postsAndTheirPreviewImgs[overallPostId] ?? 'images/defaultVideoFrame.jpg',
          description: `@${likerName} liked your post`,
          leftImageLink: `http://34.111.89.101/profile/${likerName}`,
          entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}`
        }
      ];
    });


    nodeJSWebSocketDotIO.on('NewCommentOfPost', async (data) => {
      const { commenterId } = data;
      if (this.authUserId == commenterId) {
        return;
      }

      if (!(commenterId in this.usersAndTheirRelevantInfo) ||
      !('profilePhoto' in this.usersAndTheirRelevantInfo[commenterId])) {
        await this.getProfilePhotoOfUser(commenterId);
      }

      const { overallPostId, id, commenterName, comment } = data;

      if (!(overallPostId in this.postsAndTheirPreviewImgs)) {
        await this.getPreviewImageOfPost(overallPostId);
      }

      this.orderedListOfNotifications = [
        ...this.orderedListOfNotifications,
        {
          leftImage: this.usersAndTheirRelevantInfo[commenterId]?.profilePhoto ??'images/defaultPfp.png',
          rightImage: this.postsAndTheirPreviewImgs[overallPostId] ?? 'iamges/defaultVideoFrame.jpg',
          description: `@${commenterName} commented on your post: '${comment}'`,
          leftImageLink: `http://34.111.89.101/profile/${commenterName}`,
          entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}?commentId=${id}`
        }
      ];
    });
  }


  establishCollaborationWithCSharpSignalRWebSocket() {
    const cSharpSignalRWebSocket = new signalR.HubConnectionBuilder()
    .withUrl('http://34.111.89.101/socket/Home-Page/cSharpSignalRWebSocket', {
      withCredentials: true,
      accessTokenFactory: () => "",
      transport: signalR.HttpTransportType.WebSockets,
      headers: {
        "userId": this.authUserId.toString(),
        "updatesToSubscribeTo": JSON.stringify(['comment-likes', 'comment-replies'])
      }
    })
    .configureLogging(signalR.LogLevel.Information)
    .build();


    cSharpSignalRWebSocket.onclose((_) => {
      console.error(`There was trouble with the cSharpSignalRWebSocket connection, which is responsible
      for providing info for notifications of new comment-likes and comment-replies.`);
    });


    cSharpSignalRWebSocket.on('NewLikeOfComment', async (data) => {
      const { likerId } = data;

      if (likerId == this.authUserId) {
        return;
      }

      if (!(likerId in this.usersAndTheirRelevantInfo) ||
      !('profilePhoto' in this.usersAndTheirRelevantInfo[likerId])) {
        await this.getProfilePhotoOfUser(likerId);
      }

      const { overallPostId, commentId, comment, likerName } = data;

      if (!(overallPostId in this.postsAndTheirPreviewImgs)) {
        await this.getPreviewImageOfPost(overallPostId);
      }

      this.orderedListOfNotifications = [
        ...this.orderedListOfNotifications,
        {
          leftImage: this.usersAndTheirRelevantInfo[likerId]?.profilePhoto ?? 'images/defaultPfp.png',
          rightImage: this.postsAndTheirPreviewImgs[overallPostId] ?? 'images/defaultVideoFrame.jpg',
          description: `@${likerName} liked your comment: '${comment}'`,
          leftImageLink: `http://34.111.89.101/profile/${likerName}`,
          entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}?commentId=${commentId}`
        }
      ];
    });


    cSharpSignalRWebSocket.on('NewReplyOfComment', async (data) => {
      const { replierId } = data;

      if (replierId == this.authUserId) {
        return;
      }

      if (!(replierId in this.usersAndTheirRelevantInfo) ||
      !('profilePhoto' in this.usersAndTheirRelevantInfo[replierId])) {
        await this.getProfilePhotoOfUser(replierId);
      }

      const { overallPostId, replyId, replierName, reply } = data;

      if (!(overallPostId in this.postsAndTheirPreviewImgs)) {
        await this.getPreviewImageOfPost(overallPostId);
      }

      this.orderedListOfNotifications = [
        ...this.orderedListOfNotifications,
        {
          leftImage: this.usersAndTheirRelevantInfo[replierId]?.profilePhoto ?? 'images/defaultPfp.png',
          rightImage: this.postsAndTheirPreviewImgs[overallPostId] ?? 'images/defaultVideoFrame.jpg',
          description: `@${replierName} replied to your comment with this: '${reply}'`,
          leftImageLink: `http://34.111.89.101/profile/${replierName}`,
          entireNotificationLink: `http://34.111.89.101/posts/${overallPostId}?commentId=${replyId}`
        }
      ];
    });


    cSharpSignalRWebSocket.start().catch(_ => {
      console.error(`There was trouble with the cSharpSignalRWebSocket connection, which is responsible
      for providing info for notifications of new comment-likes and comment-replies.`);
    });
  }


  establishCollaborationWithPhpRatchetWebSocket() {
    const queryParams = new URLSearchParams({
      userId: this.authUserId.toString()
    });


    const phpRatchetWebSocket = new WebSocket(
      `ws://34.111.89.101/socket/Home-Page/phpRatchetWebSocket?${queryParams.toString()}`
    );


    phpRatchetWebSocket.onerror = (_) => {
      console.error(`There was trouble with the phpRatchetWebSocket connection, which is responsible
      for providing info for notifications of new followings/follow-requests.`);
    };


    phpRatchetWebSocket.onmessage = async (messageEvent) => {
      const parsedMessageData = JSON.parse(messageEvent.data);

      if (parsedMessageData.event === 'NewFollowRequest') {
        const { requesterId } = parsedMessageData.data;

        if (!(requesterId in this.usersAndTheirRelevantInfo) ||
        !('profilePhoto' in this.usersAndTheirRelevantInfo[requesterId])) {
          await this.getProfilePhotoOfUser(requesterId);
        }

        const { requesterName } = parsedMessageData.data;

        this.orderedListOfNotifications = [
          ...this.orderedListOfNotifications,
          {
            leftImage: this.usersAndTheirRelevantInfo[requesterId]?.profilePhoto ?? 'images/defaultPfp.png',
            rightImage: null, 
            description: `@${requesterName} requested to follow you`,
            leftImageLink: `http://34.111.89.101/profile/${requesterName}`,
            entireNotificationLink: `http://34.111.89.101/profile/${requesterName}`
          }
        ];
      } 
      else if (parsedMessageData.event === 'NewFollowing') {
        const { followerId } = parsedMessageData.data;

        if (!(followerId in this.usersAndTheirRelevantInfo) ||
        !('profilePhoto' in this.usersAndTheirRelevantInfo[followerId])) {
          await this.getProfilePhotoOfUser(followerId);
        }

        const { followerName } = parsedMessageData.data;

        this.orderedListOfNotifications = [
          ...this.orderedListOfNotifications,
          {
            leftImage: this.usersAndTheirRelevantInfo[followerId]?.profilePhoto ?? 'images/defaultPfp.png',
            rightImage: null, 
            description: `@${followerName} is now following you`,
            leftImageLink: `http://34.111.89.101/profile/${followerName}`,
            entireNotificationLink: `http://34.111.89.101/profile/${followerName}`
          }
        ];
      }
    }
  }


  establishCollaborationWithPythonWebSocket() {
    const pythonWebSocket = new WebSocket(
      `ws://34.111.89.101/socket/Home-Page/pythonWebSocket?userId=${encodeURIComponent(this.authUserId)}&updatesToSubscribeTo=${encodeURIComponent(JSON.stringify(['new-messages']))}`
    );

  
    pythonWebSocket.onerror = (_) => {
      console.error(`There was trouble with the pythonWebSocket connection, which is responsible for providing info for
      new messages.`);
    };


    pythonWebSocket.onmessage = async (messageEvent) => {
      const parsedMessageData = JSON.parse(messageEvent.data);

      if (parsedMessageData.event === 'NewMessageOfConvo') {
        const { senderId } = parsedMessageData.data;

        if (senderId == this.authUserId) {
          return;
        }

        if (!(senderId in this.usersAndTheirRelevantInfo) ||
        !('profilePhoto' in this.usersAndTheirRelevantInfo[senderId])) {
          await this.getProfilePhotoOfUser(senderId);
        }

        const { convoId, convoTitle, isGroupChat, senderName, message } = parsedMessageData.data;

        let description = '';

        if (isGroupChat) {
          if (convoTitle !== null) {
            description = `@${senderName} sent a message in your group-chat named '${convoTitle}': ${message}`;
          }
          else {
            description = `@${senderName} sent a message in your group-chat: ${message}`;
          }
        }
        else {
          if (convoTitle !== null) {
            description = `@${senderName} sent a message to you in the convo named '${convoTitle}': ${message}`;
          }
          else {
            description = `@${senderName} sent a message to you: ${message}`;
          }
        }

        this.orderedListOfNotifications = [
          ...this.orderedListOfNotifications,
          {
            leftImage: this.usersAndTheirRelevantInfo[senderId]?.profilePhoto ?? 'images/defaultPfp.png',
            rightImage: isGroupChat ? 'images/defaultGroupChatPfp.png' : null, 
            description: description,
            leftImageLink: `http://34.111.89.101/profile/${senderId}`,
            entireNotificationLink: `http://34.111.89.101/messages/${convoId}`
          }
        ];
      } 
    }
  }


  async getProfilePhotoOfUser(userId:number) {
    try {
      const response = await fetch(`http://34.111.89.101/api/Home-Page/laravelBackend1/getProfilePhotoOfUser/${this.authUserId}
      /${userId}`, {
        credentials: 'include'
      });

      if(response.ok) {
        const userProfilePhotoBlob = await response.blob();
        const userProfilePhotoURL = URL.createObjectURL(userProfilePhotoBlob);

        if (!(userId in this.usersAndTheirRelevantInfo)) {
          this.usersAndTheirRelevantInfo[userId] = {};
        }

        this.usersAndTheirRelevantInfo[userId].profilePhoto = userProfilePhotoURL;
      }
    }
    catch {
      console.error(`There was trouble getting the profile-photo of user ${userId}, which is needed for at-least one
      of the notifications`);
    }
  }


  async getPreviewImageOfPost(overallPostId:string) {
    try {
      const response = await fetch(`http://34.111.89.101/api/Home-Page/expressJSBackend1/getPreviewImageOfPost
      /${this.authUserId}/${overallPostId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const previewImageBlob = await response.blob();
        const previewImageURL = URL.createObjectURL(previewImageBlob);

        this.postsAndTheirPreviewImgs[overallPostId] = previewImageURL;
      }
    }
    catch {
      console.error(`There was trouble getting the preview-image of post ${overallPostId}, which is needed
      for at-least one of the notifications`);
    }
  }
}
