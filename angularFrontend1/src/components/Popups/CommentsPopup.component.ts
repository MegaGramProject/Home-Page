import { Comment } from '../Comment.component';
import { FollowUser } from '../FollowUser.component';
import { PostDots } from '../PostDots.component';
import { UserIcon } from '../UserIcon.component';

import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'CommentsPopup',
  templateUrl: '../../templates/Popups/CommentsPopup.component.html',
  imports: [CommonModule, FormsModule, Comment, FollowUser, PostDots, UserIcon],
  standalone: true
})
export class CommentsPopup {
  @Input() authUserId!:number;
  @Input() authUsername!:string;

  @Input() postDetails!:any;

  @Input() usersAndTheirRelevantInfo!:any;
  @Output() updateUsersAndTheirRelevantInfo:EventEmitter<any> = new EventEmitter<any>();
  @Input() mainPostAuthorInfo!:any;

  @Input() currSlide!:number;

  @Input() zIndex!:string;

  @Output() closePopup:EventEmitter<any> = new EventEmitter<any>();
  @Output() showErrorPopup:EventEmitter<string> = new EventEmitter<string>();
  @Output() showSendPostPopup:EventEmitter<string> = new EventEmitter<string>();
  @Output() showThreeDotsPopup:EventEmitter<any> = new EventEmitter<any>();
  @Output() showLikersPopup:EventEmitter<string|number> = new EventEmitter<string|number>();

  @Output() updatePostDetails:EventEmitter<{ overallPostId: string, isLiked?: boolean, numLikes?: number, numComments?:number,
  isSaved?: boolean }> = new EventEmitter<{ overallPostId: string, isLiked?: boolean, numLikes?: number, numComments?:number,
  isSaved?: boolean }>();

  @Output() showStoryViewer:EventEmitter<{ newStoryViewerMainUserId: number, newStoryViewerMainUsername: string,
  newStoryViewerIsFromStoriesSection:boolean }> = new EventEmitter<{ newStoryViewerMainUserId: number, newStoryViewerMainUsername:
  string, newStoryViewerIsFromStoriesSection:boolean }>();

  overallPostId:string = '';

  mainPostAuthorId:number = -1;

  bgMusicIsPlaying:boolean = false;
  bgMusicObject:any = null;

  currSlideState:number = 0;
  displayTaggedAccountsOfSlide:boolean = false;
  displaySectionsOfVidSlide:boolean = false;

  commentInput:string = '';
  commentInputTextareaIsActive:boolean = false;

  slideToVidTimeToFrameMappings:any = {};

  heartAnimationCoordinates:number[] = [-1, -1];
  intervalIdForHeartAnimation:any = null;

  orderedListOfComments:any[] = [];
  commentIdsToExclude:number[] = [];

  newlyPostedCommentsByAuthUser:any[] = [];
  newlyPostedRepliesByAuthUser:any[] = [];

  initialCommentsFetchingIsComplete:boolean = false;
  isCurrentlyFetchingAdditionalComments:boolean = false;
  initialCommentsFetchingErrorMessage:string = '';
  additionalCommentsFetchingErrorMessage:string = '';

  replyingToCommentInfo:any = null;

  @ViewChild('vidSlideRef') vidSlideRef!:ElementRef;
  @ViewChild('currSlideRef') currSlideRef!:ElementRef;

  languageCodeToLabelMappings:any = {
    "af": "Afrikaans",
    "sq": "Albanian",
    "am": "Amharic",
    "ar": "Arabic",
    "hy": "Armenian",
    "az": "Azerbaijani",
    "eu": "Basque",
    "be": "Belarusian",
    "bn": "Bengali",
    "bs": "Bosnian",
    "bg": "Bulgarian",
    "ca": "Catalan",
    "zh-CN": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    "hr": "Croatian",
    "cs": "Czech",
    "da": "Danish",
    "nl": "Dutch",
    "en": "English",
    "et": "Estonian",
    "fi": "Finnish",
    "fr": "French",
    "gl": "Galician",
    "ka": "Georgian",
    "de": "German",
    "el": "Greek",
    "gu": "Gujarati",
    "ht": "Haitian Creole",
    "ha": "Hausa",
    "he": "Hebrew",
    "hi": "Hindi",
    "hu": "Hungarian",
    "is": "Icelandic",
    "id": "Indonesian",
    "ga": "Irish",
    "it": "Italian",
    "ja": "Japanese",
    "kn": "Kannada",
    "kk": "Kazakh",
    "km": "Khmer",
    "ko": "Korean",
    "ku": "Kurdish",
    "ky": "Kyrgyz",
    "lo": "Lao",
    "lv": "Latvian",
    "lt": "Lithuanian",
    "mk": "Macedonian",
    "ms": "Malay",
    "ml": "Malayalam",
    "mt": "Maltese",
    "mi": "Maori",
    "mr": "Marathi",
    "mn": "Mongolian",
    "ne": "Nepali",
    "no": "Norwegian",
    "fa": "Persian",
    "pl": "Polish",
    "pt-BR": "Portuguese (Brazil)",
    "pt-PT": "Portuguese (Portugal)",
    "pa": "Punjabi",
    "ro": "Romanian",
    "ru": "Russian",
    "sr": "Serbian",
    "si": "Sinhala",
    "sk": "Slovak",
    "sl": "Slovenian",
    "so": "Somali",
    "es": "Spanish",
    "sw": "Swahili",
    "sv": "Swedish",
    "tl": "Tagalog",
    "ta": "Tamil",
    "te": "Telugu",
    "th": "Thai",
    "tr": "Turkish",
    "uk": "Ukrainian",
    "ur": "Urdu",
    "uz": "Uzbek",
    "vi": "Vietnamese",
    "cy": "Welsh",
    "xh": "Xhosa",
    "yi": "Yiddish",
    "zu": "Zulu"
  };


  ngOnInit() {
    this.overallPostId = this.postDetails.overallPostId;
    this.mainPostAuthorId = this.postDetails.authorIds[0];
    this.currSlideState = this.currSlide;

    if(this.postDetails.backgroundMusic !== null) {
      this.bgMusicObject = new Audio(this.postDetails.bgMusic.src);

      this.bgMusicObject.addEventListener('loadedmetadata', () => {
        if (this.postDetails.bgMusic.startTime > 0) {
          this.bgMusicObject.currentTime = this.postDetails.bgMusic.startTime;
        }
      });

      this.bgMusicObject.addEventListener('timeupdate', () => {
        let bgMusicEndTime = -1;

        if (this.postDetails.bgMusic.endTime == -1) {
          bgMusicEndTime = this.bgMusicObject.duration;
        }
        else {
          bgMusicEndTime = this.postDetails.bgMusic.endTime;
        }

        if (this.bgMusicObject.currentTime >= bgMusicEndTime) {
          if (this.postDetails.bgMusic.startTime > 0) {
            this.bgMusicObject.currentTime = this.postDetails.bgMusic.startTime;
          }
          else {
            this.bgMusicObject.currentTime = 0;
          }
        }
      });
    }

    window.addEventListener('keydown', (event) => this.handleKeyDownEvents(event));
    this.fetchComments('initial');
  }


  ngOnDestroy() {
    window.removeEventListener('keydown', (event) => this.handleKeyDownEvents(event));
  }


  handleKeyDownEvents(event:any) {
    const currSlideIsVid = this.postDetails.slides[this.currSlideState].type === 'video';

    switch (event.key) {
      case 'Escape':
        if (!currSlideIsVid) {
          this.closePopup.emit();
        }
        break;
      case 'Enter':
        if (this.commentInputTextareaIsActive && this.commentInput.length > 0) {
          this.postComment();
        }
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        if (!this.commentInputTextareaIsActive && !currSlideIsVid && this.currSlideState > 0) {
          this.changeSlide('decrement');
        }
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        if (!this.commentInputTextareaIsActive && !currSlideIsVid && this.currSlideState + 1 <
        this.postDetails.slides.length) {
          this.changeSlide('increment');
        }
        break;
      case 'm':
      case 'M':
        if (!this.commentInputTextareaIsActive && !currSlideIsVid && this.bgMusicIsPlaying) {
          this.togglePauseBackgroundMusic();
        }
        break;
      case 'k':
      case 'K':
      case ' ':
        if (!this.commentInputTextareaIsActive && !currSlideIsVid && this.bgMusicObject !== null) {
          this.togglePauseBackgroundMusic();
        }
    }
  }


  changeSlide(incrementOrDecrementText:string) {
    this.displaySectionsOfVidSlide = false;
    this.displayTaggedAccountsOfSlide = false;

    if(incrementOrDecrementText === 'increment') {
      this.currSlideState++;
    }
    else {
      this.currSlideState--;
    }
  }


  toggleShowTaggedAccountsOfSlide() {
    if(!this.displayTaggedAccountsOfSlide) {
      this.displaySectionsOfVidSlide = false;
      this.displayTaggedAccountsOfSlide = true;
    }
    else {
      this.displayTaggedAccountsOfSlide = false;
    }
  }


  startHeartAnimation(startX:number, startY:number) {
    if (this.intervalIdForHeartAnimation !== null) {
      return;
    }

    this.heartAnimationCoordinates = [startX, startY];
    
    this.intervalIdForHeartAnimation = 'on the way...';

    setTimeout(() => {
      const newIntervalIdForLikePostHeartAnimation = setInterval(() => {
        const currentX = this.heartAnimationCoordinates[0];
        const currentY = this.heartAnimationCoordinates[1];

        if (currentY < -7) {
          clearInterval(newIntervalIdForLikePostHeartAnimation);
          this.intervalIdForHeartAnimation = null;
        }
        else {
          this.heartAnimationCoordinates = [currentX, currentY - 1];
        }
      }, 10);

      this.intervalIdForHeartAnimation = newIntervalIdForLikePostHeartAnimation;
    }, 400);
  }


  takeUserToSectionInVideo(timeInSeconds:number) {
    if (this.vidSlideRef.nativeElement) {
      this.vidSlideRef.nativeElement.currentTime = timeInSeconds;
      this.vidSlideRef.nativeElement.play();
    }
  }


  async toggleShowSectionsOfVidSlide() {
    this.displayTaggedAccountsOfSlide = false;
    this.displaySectionsOfVidSlide = !this.displaySectionsOfVidSlide;

    if (this.displaySectionsOfVidSlide && this.postDetails.slides[this.currSlideState].sections.length > 0 &&
    !(this.currSlideState in this.slideToVidTimeToFrameMappings)) {
        for(let sectionInfo of this.postDetails.slides[this.currSlideState].sections) {
          await this.getVideoFrameAtSpecifiedSlideAndTime(this.currSlideState, sectionInfo[0]);
        }
    }
  }


  async getVideoFrameAtSpecifiedSlideAndTime(slide:number, timeInSeconds:number) {
    return new Promise((resolve, reject) => {
      const slideToVidTimeToFrameMappingsValue = this.slideToVidTimeToFrameMappings;

      if (slide in slideToVidTimeToFrameMappingsValue && timeInSeconds in slideToVidTimeToFrameMappingsValue[slide]) {
        resolve(slideToVidTimeToFrameMappingsValue[slide][timeInSeconds]);
      }

      const newSlideToVidTimeToFrameMappings = { ...slideToVidTimeToFrameMappingsValue };
  
      if (!(slide in slideToVidTimeToFrameMappingsValue)) {
        newSlideToVidTimeToFrameMappings[slide] = {};
      }

      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.src = this.postDetails.slides[slide].src;


      video.addEventListener('loadeddata', () => {
        video.currentTime = timeInSeconds;
      });


      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx:any = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const frameImage = canvas.toDataURL('image/png');

        newSlideToVidTimeToFrameMappings[slide][timeInSeconds] = frameImage;
        this.slideToVidTimeToFrameMappings = newSlideToVidTimeToFrameMappings;

        resolve(frameImage);
      });


      video.onerror = (e) => {
        e;
        reject(new Error('Error loading video'));
      };
    });
  }


  togglePauseBackgroundMusic() {
    if(!this.bgMusicIsPlaying) {
      this.bgMusicObject.play();
    }
    else {
      this.bgMusicObject.pause();
    }
    
    this.bgMusicIsPlaying = !this.bgMusicIsPlaying;
  }


  updateCommentDetails(infoOnUpdate:{ id: number, updatedDetails: any }) {
    let commentFound = false;

    const newNewlyPostedCommentsByAuthUser = this.newlyPostedCommentsByAuthUser.filter(commentDetails => {
      if(commentDetails.id == infoOnUpdate.id) {
        commentFound = true;

        const newCommentDetails = {...commentDetails};
        for(let key of Object.keys(infoOnUpdate.updatedDetails)) {
          newCommentDetails[key] = infoOnUpdate.updatedDetails[key];
        }

        return newCommentDetails;
      }
    });

    if (commentFound) {
      this.newlyPostedCommentsByAuthUser = newNewlyPostedCommentsByAuthUser;
      return;
    }

    const newNewlyPostedRepliesByAuthUser = this.newlyPostedCommentsByAuthUser.filter(replyDetails => {
      if(replyDetails.id == infoOnUpdate.id) {
        commentFound = true;

        const newCommentDetails = {...replyDetails};
        for(let key of Object.keys(infoOnUpdate.updatedDetails)) {
          newCommentDetails[key] = infoOnUpdate.updatedDetails[key];
        }
        
        return newCommentDetails;
      }
    });

    if (commentFound) {
      this.newlyPostedCommentsByAuthUser = newNewlyPostedRepliesByAuthUser;
      return;
    }

    const newOrderedListOfComments = this.orderedListOfComments.map(commentDetails => {
      if(commentDetails.id == infoOnUpdate.id) {
        commentFound = true;

        const newCommentDetails = {...commentDetails};
        for(let key of Object.keys(infoOnUpdate.updatedDetails)) {
          newCommentDetails[key] = infoOnUpdate.updatedDetails[key];
        }
        
        return newCommentDetails;
      }
    });
        
    this.orderedListOfComments = newOrderedListOfComments;
  }


  updateReplyingToCommentInfo(newReplyingToCommentInfo:{ id: number, authorUsername: string, content: string, numReplies:
  number }) {
    if(this.replyingToCommentInfo !== null && this.replyingToCommentInfo.id == newReplyingToCommentInfo!.id) {
      this.replyingToCommentInfo = null;
    }
    else {
      this.replyingToCommentInfo = newReplyingToCommentInfo;
    }
  }


  editComment(infoOnEdit:{ id: number, newContent :string }) {
    let commentFound = false;
    
    const newNewlyPostedCommentsByAuthUser = this.newlyPostedCommentsByAuthUser.map(commentDetails => {
      if(commentDetails.id == infoOnEdit.id) {
        commentFound = true;
        const newCommentDetails = {...commentDetails};
        newCommentDetails.content = infoOnEdit.newContent;
        newCommentDetails.datetime = (new Date()).toISOString();
        newCommentDetails.isEdited = true;
        return newCommentDetails;
      }
      return commentDetails;
    });

    if (commentFound) {
      this.newlyPostedCommentsByAuthUser = newNewlyPostedCommentsByAuthUser;
      return;
    }

    const newNewlyPostedRepliesByAuthUser = this.newlyPostedRepliesByAuthUser.map(replyDetails => {
      if(replyDetails.id == infoOnEdit.id) {
        commentFound = true;
        const newReplyDetails = {...replyDetails};
        newReplyDetails.content = infoOnEdit.newContent;
        newReplyDetails.datetime = (new Date()).toISOString();
        newReplyDetails.isEdited = true;
        return newReplyDetails;
      }
      return replyDetails;
    });

    if (commentFound) {
      this.newlyPostedRepliesByAuthUser = newNewlyPostedRepliesByAuthUser;
      return;
    }
    
    const newOrderedListOfComments = this.orderedListOfComments.map(commentDetails => {
      if(commentDetails.id == infoOnEdit.id) {
        const newCommentDetails = {...commentDetails};
        newCommentDetails.content = infoOnEdit.newContent;
        newCommentDetails.datetime = (new Date()).toISOString();
        newCommentDetails.isEdited = true;
        return newCommentDetails;  
      }
      return commentDetails;
    });
    
    this.orderedListOfComments = newOrderedListOfComments;
  }


  deleteComment(id:number) {
    let commentFound = false;

    const newNewlyPostedCommentsByAuthUser = this.newlyPostedCommentsByAuthUser.filter(commentDetails => {
      if(commentDetails.id == id) {
        commentFound = true;
        return false;
      }
      return true;
    });

    if (commentFound) {
      this.newlyPostedCommentsByAuthUser = newNewlyPostedCommentsByAuthUser;
      return;
    }

    const newNewlyPostedRepliesByAuthUser = this.newlyPostedRepliesByAuthUser.filter(replyDetails => {
      if(replyDetails.id == id) {
        commentFound = true;
        return false;
      }
      return true;
    });

    if (commentFound) {
      this.newlyPostedRepliesByAuthUser = newNewlyPostedRepliesByAuthUser;
      return;
    }

    const newOrderedListOfComments = this.orderedListOfComments.filter(commentDetails => {
      if(commentDetails.id == id) {
        return false;
      }
      return true;
    });
    
    this.orderedListOfComments = newOrderedListOfComments;
  }


  formatDatetimeString(datetimeString:string) {
    const now:any = new Date();
    const pastDate:any = new Date(datetimeString);
    const diff = now - pastDate;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) {
      return `${seconds}s`;
    }
    else if (minutes < 60) {
      return `${minutes}m`;
    }
    else if (hours < 24) {
      return `${hours}h`;
    }
    else if (days < 7) {
      return `${days}d`;
    }
    else if (weeks < 4) {
      return `${weeks}w`;
    }
    else if (months < 12) {
      return `${months}mo`;
    }
    else {
      return `${years}y`;
    }
  }


  async fetchComments(initialOrAdditionalText:string) {
    if(initialOrAdditionalText === 'additional') {
      this.isCurrentlyFetchingAdditionalComments = true;
    }

    try {
      const response = await fetch(
      `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getBatchOfCommentsOfPost/${this.authUserId}
      /${this.overallPostId}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          commentIdsToExclude: this.commentIdsToExclude,
          limit: this.postDetails.numComments - this.commentIdsToExclude.length
        }),
        credentials: 'include'
      });
      if(!response.ok) {
        if(initialOrAdditionalText === 'initial') {
          this.initialCommentsFetchingErrorMessage = `The server had trouble getting the initial batch of comments of this
          post`;
        }
        else {
          this.additionalCommentsFetchingErrorMessage = `The server had trouble getting the additional batch of
          comments of this post`;;
        }
      }
      else {
        let newlyFetchedOrderedComments:any[] = await response.json();
        newlyFetchedOrderedComments = newlyFetchedOrderedComments.map(comment => {
          comment.datetime = this.formatDatetimeString(comment.datetime);
          return comment;
        });

        let newOrderedListOfComments = [...this.orderedListOfComments, ...newlyFetchedOrderedComments];
        
        const newCommentIdsToExclude = [...this.commentIdsToExclude];
        for(let newlyFetchedComment of newlyFetchedOrderedComments) {
            newCommentIdsToExclude.push(newlyFetchedComment.id);
        }

        this.commentIdsToExclude = newCommentIdsToExclude;
        this.orderedListOfComments = newOrderedListOfComments;
    
        this.fetchAllTheNecessaryInfo(newlyFetchedOrderedComments.map(comment => comment.authorId));
      }
    }
    catch (error) {
      if(initialOrAdditionalText === 'initial') {
        this.initialCommentsFetchingErrorMessage = `There was trouble connecting to the server to get the initial batch of
        comments of this post`;
      }
      else {
        this.additionalCommentsFetchingErrorMessage = `There was trouble connecting to the server to get the additional
        batch of comments of this post`;
      }
    }
    finally {
      if(initialOrAdditionalText === 'initial') {
        this.initialCommentsFetchingIsComplete = true;
      }
      else {
        this.isCurrentlyFetchingAdditionalComments = false;
      }
    }
  }


  async fetchAllTheNecessaryInfo(newCommenterIds:any[]) {
    let graphqlUserQueryStringHeaderInfo:any = {};
    let graphqlUserQueryString = '';
    let graphqlUserVariables:any = {};

    let usersAndTheirUsernames:any = {};
    const newCommenterIdsNeededForUsernames = newCommenterIds.filter(newCommenterId => {
      if (!(newCommenterId in this.usersAndTheirRelevantInfo) || !('username' in
      this.usersAndTheirRelevantInfo[newCommenterId])) {
        return true;
      }
      return false;
    });

    if (newCommenterIdsNeededForUsernames.length > 0) {
      graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
      graphqlUserQueryStringHeaderInfo['$newCommenterIdsNeededForUsernames'] = '[Int!]!';

      graphqlUserQueryString +=
      `getUsernamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newCommenterIdsNeededForUsernames) `;
      graphqlUserVariables.authUserId = this.authUserId;
      graphqlUserVariables.newCommenterIdsNeededForUsernames = newCommenterIdsNeededForUsernames;
    }

    let usersAndTheirVerificationStatuses:any = {};
    const newCommenterIdsNeededForVerificationStatuses = newCommenterIds.filter(newCommenterId => {
      if (!(newCommenterId in this.usersAndTheirRelevantInfo) || !('isVerified' in
      this.usersAndTheirRelevantInfo[newCommenterId])) {
        return true;
      }
      return false;
    });

    if (newCommenterIdsNeededForVerificationStatuses.length>0) {
      graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
      graphqlUserQueryStringHeaderInfo['$newCommenterIdsNeededForVerificationStatuses'] = '[Int!]!';

      graphqlUserQueryString +=
      `getVerificationStatusesOfListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds:
      $newCommenterIdsNeededForVerificationStatuses) `;
      graphqlUserVariables.authUserId = this.authUserId;
      graphqlUserVariables.newCommenterIdsNeededForVerificationStatuses = newCommenterIdsNeededForVerificationStatuses;
    }

    if (graphqlUserQueryString.length > 0) {
      let graphqlUserQueryStringHeader = 'query (';
      let graphqlUserQueryStringHeaderKeys = Object.keys(graphqlUserQueryStringHeaderInfo);

      for(let i=0; i<graphqlUserQueryStringHeaderKeys.length; i++) {
        const key = graphqlUserQueryStringHeaderKeys[i];
        const value = graphqlUserQueryStringHeaderInfo[key];

        if (i < graphqlUserQueryStringHeaderKeys.length-1) {
          graphqlUserQueryStringHeader+= `${key}: ${value}, `;
        }
        else {
          graphqlUserQueryStringHeader+= `${key}: ${value}`;
        }
      }

      graphqlUserQueryStringHeader+= '){ ';
      graphqlUserQueryString = graphqlUserQueryStringHeader + graphqlUserQueryString + '}';

      try {
        const response = await fetch(`http://34.111.89.101/api/Home-Page/laravelBackend1/graphql`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            query: graphqlUserQueryString,
            variables: graphqlUserVariables
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          if (newCommenterIdsNeededForUsernames.length > 0) {
            console.error(
              'The server had trouble fetching the usernames of all the newly fetched comment-authors'
            );
          }

          if (newCommenterIdsNeededForVerificationStatuses.length > 0) {
            console.error(
              `The server had trouble fetching the verification-statuses of all the new fetched
              comment-authors`
            );
          }
        }
        else {
          const responseData = await response.json();

          if (newCommenterIdsNeededForUsernames.length > 0) {
            const listOfUsernamesForNewCommenterIds = responseData.data.getListOfUsernamesForUserIds;

            for(let i=0; i<newCommenterIdsNeededForUsernames.length; i++) {
              const newCommenterId = newCommenterIdsNeededForUsernames[i];
              const newCommenterUsername = listOfUsernamesForNewCommenterIds[i];

              if (newCommenterUsername !== null) {
                usersAndTheirUsernames[newCommenterId] = newCommenterUsername;
              }
            }
          }

          if (newCommenterIdsNeededForVerificationStatuses.length > 0) {
            const listOfVerificationStatusesForNewCommenterIds = responseData.data
            .getListOfUserVerificationStatusesForUserIds;

            for(let i=0; i<newCommenterIdsNeededForVerificationStatuses.length; i++) {
              const newCommenterId = newCommenterIdsNeededForVerificationStatuses[i];
              const newCommenterVerificationStatus = listOfVerificationStatusesForNewCommenterIds[i];

              if (newCommenterVerificationStatus !== null) {
                usersAndTheirVerificationStatuses[newCommenterId] = newCommenterVerificationStatus;
              }
            }
          }
        }
      }
      catch {
        if (newCommenterIdsNeededForUsernames.length > 0) {
          console.error(
            `There was trouble connecting to the server to fetch the usernames of all the newly fetched
            comment-authors`
          );
        }

        if (newCommenterIdsNeededForVerificationStatuses.length > 0) {
          console.error(
            `There was trouble connecting to the server to fetch the verification-statuses of all the newly
            fetched comment-authors`
          );
        }
      }
    }

    let usersAndTheirPfps:any = {};
    const newCommenterIdsNeededForPfps = newCommenterIds.filter(newCommenterId => {
      if (!(newCommenterId in this.usersAndTheirRelevantInfo) || !('profilePhoto' in
      this.usersAndTheirRelevantInfo[newCommenterId])) {
        return true;
      }
      return false;
    });
    if (newCommenterIdsNeededForPfps.length>0) {
      try {
        const response2 = await fetch(
          'http://34.111.89.101/api/Home-Page/laravelBackend1/getProfilePhotosOfMultipleUsers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              userIds: newCommenterIdsNeededForPfps
            })
          });
          
        if(!response2.ok) {
          console.error(
            'The server had trouble fetching the profile-photos of all the newly fetched comment-authors'
          );
        }
        else {
          usersAndTheirPfps = await response2.json();
        }
      }
      catch {
        console.error(
          'There was trouble connecting to the server to fetch the profile-photos of all the newly fetched comment-authors'
        );
      }
    }

    const newUsersAndTheirRelevantInfo = {...this.usersAndTheirRelevantInfo};

    for(let newCommenterId of newCommenterIds) {
      if (!(newCommenterId in usersAndTheirUsernames) && !(newCommenterId in usersAndTheirVerificationStatuses) &&
      !(newCommenterId in usersAndTheirPfps)) {
        continue;
      }

      if(!(newCommenterId in newUsersAndTheirRelevantInfo)) {
        newUsersAndTheirRelevantInfo[newCommenterId] = {};
      }
      
      if (newCommenterId in usersAndTheirUsernames) {
        newUsersAndTheirRelevantInfo[newCommenterId].username = usersAndTheirUsernames[newCommenterId];
      }
      if (newCommenterId in usersAndTheirVerificationStatuses) {
        newUsersAndTheirRelevantInfo[newCommenterId].isVerified = usersAndTheirVerificationStatuses[newCommenterId];
      }
      if (newCommenterId in usersAndTheirPfps) {
        newUsersAndTheirRelevantInfo[newCommenterId].profilePhoto = usersAndTheirPfps[newCommenterId];
      }
    }

    return newUsersAndTheirRelevantInfo;
  }


  async likePost(event:any) {
    if (this.postDetails.isLiked) {
      return;
    }

    if (this.authUserId == -1) {
      this.showErrorPopup.emit('Dear Anonymous Guest, you must be logged into an account to like posts');
      return;
    }

    let likeWasSuccessful = true;
    
    try {
      const response = await fetch(
      `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/addLikeToPostOrComment/${this.authUserId}/${this.overallPostId}`, {
        method: 'POST',
        credentials: 'include'
      });
      if(!response.ok) {
        this.showErrorPopup.emit('The server had trouble adding your like to this post');
        likeWasSuccessful = false;
      }
      else {
        this.updatePostDetails.emit(
          {
            overallPostId: this.overallPostId,
            isLiked: true,
            numLikes: this.postDetails.numLikes + 1
          }
        );
      }
    }
    catch (error) {
      this.showErrorPopup.emit(
        'There was trouble connecting to the server to add your like to this post'
      );
      likeWasSuccessful = false;
    }
    
    if (likeWasSuccessful) {
      if(event == null) {
        this.startHeartAnimation(50, 50);
      }
      else if (this.currSlideRef.nativeElement) {
        const rect = this.currSlideRef.nativeElement.getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;
        const xPercent = ((x - rect.left) / rect.width) * 100;
        const yPercent = ((y - rect.top) / rect.height) * 100;

        this.startHeartAnimation(xPercent, yPercent);
      }
    }
  }


  async toggleLikePost() {
    if (this.authUserId == -1) {
      this.showErrorPopup.emit('Dear Anonymous Guest, you must be logged into an account to like posts');
      return;
    }

    if(!this.postDetails.isLiked) {
      this.likePost(null);
    }
    else {
      try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/removeLikeFromPostOrComment/${this.authUserId}/
        ${this.overallPostId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if(!response.ok) {
          this.showErrorPopup.emit('The server had trouble removing your like of this post');
        }
        else {
          this.intervalIdForHeartAnimation = null;
          this.updatePostDetails.emit(
            {
              overallPostId: this.overallPostId,
              isLiked: false,
              numLikes: this.postDetails.numLikes - 1
            }
          );
        }
      }
      catch (error) {
        this.showErrorPopup.emit(
          'There was trouble connecting to the server to remove your like of this post'
        );
      }
    }
  }


  async toggleSavePost() {
    if (this.authUserId == -1) {
      this.showErrorPopup.emit('Dear Anonymous Guest, you must be logged into an account to save posts');
      return;
    }

    let toggleSaveWasSuccessful = true;

    if(this.postDetails.isSaved) {
      try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/djangoBackend2/unsavePost/${this.authUserId}/${this.overallPostId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if(!response.ok) {
          this.showErrorPopup.emit(
            'The server had trouble removing your save of this post'
          );
          toggleSaveWasSuccessful = false;
        }
      }
      catch (error) {
        this.showErrorPopup.emit(
          'There was trouble connecting to the server to remove your save of this post'
        );
        toggleSaveWasSuccessful = false;
      }
    }
    else {
      try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/djangoBackend2/savePost/${this.authUserId}/${this.overallPostId}`, {
          method: 'POST',
          credentials: 'include'
        });
        if(!response.ok) {
          this.showErrorPopup.emit(
            'The server had trouble adding your save to this post'
          );
          toggleSaveWasSuccessful = false;
        }
      }
      catch (error) {
        this.showErrorPopup.emit(
          'There was trouble connecting to the server to add your save to this post'
        );
        toggleSaveWasSuccessful = false;
      }
    }

    if(toggleSaveWasSuccessful) {
      this.updatePostDetails.emit(
        {
          overallPostId: this.overallPostId,
          isSaved: !this.postDetails.isSaved
        }
      );
    }
  }


  async postComment() {
    if (this.authUserId == -1) {
      this.showErrorPopup.emit('You cannot post comments/replies without logging into an account');
      return;
    }

    let commentOrReplyText = '';
    
    try {
      let response;

      if (this.replyingToCommentInfo == null) {
        commentOrReplyText = 'comment';

        response = await fetch(
        'http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            query: `mutation ($authUserId: Int!, $overallPostId: String!, $commentContent: String!) {
              addCommentToPost(
                authUserId: $authUserId, overallPostId: $overallPostId, commentContent: $commentContent
              )
            }`,
            variables: {
              authUserId: this.authUserId,
              overallPostId: this.overallPostId,
              commentContent: this.commentInput
            }
          }),
          credentials: 'include'
        });
      }
      else {
        commentOrReplyText = 'reply';

        response = await fetch(
        'http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/graphql', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            query: `mutation ($authUserId: Int!, $commentId: Int!, $commentContent: String!) {
              addReplyToComment(authUserId: $authUserId, commentId: $commentId, commentContent: $commentContent)
            }`,
            variables: {
              authUserId: this.authUserId,
              commentId: this.replyingToCommentInfo.id,
              commentContent: this.commentInput
            }
          }),
          credentials: 'include'
        });
      }

      if(!response.ok) {
        this.showErrorPopup.emit(`The server had trouble adding your ${commentOrReplyText}.`);
      }
      else {
        let newCommentOrReplyId = await response.json();
        
        if (commentOrReplyText === 'comment') {
          newCommentOrReplyId = newCommentOrReplyId.data.addCommentToPost;

          this.updatePostDetails.emit(
            {
              overallPostId: this.overallPostId,
              numComments: this.postDetails.numComments + 1
            }
          );

          this.newlyPostedCommentsByAuthUser = [
            {
              id: newCommentOrReplyId,
              content: this.commentInput,
              datetime: (new Date()).toISOString(),
              isEdited: false,
              numLikes: 0,
              numReplies: 0,
              isLikedByAuthUser: false
            },
            ...this.newlyPostedCommentsByAuthUser
          ];

          this.commentIdsToExclude = [...this.commentIdsToExclude, newCommentOrReplyId];
        }
        else {
          newCommentOrReplyId = newCommentOrReplyId.data.addReplyToComment;

          this.updateCommentDetails(
            {
              id:this.replyingToCommentInfo.id,
              updatedDetails: {
                numReplies: this.replyingToCommentInfo.numReplies + 1
              }
            }
          );

          this.newlyPostedRepliesByAuthUser = [
            {
              id: newCommentOrReplyId,
              content: this.commentInput,
              datetime: (new Date()).toISOString(),
              isEdited: false,
              numLikes: 0,
              numReplies: 0,
              isLikedByAuthUser: false,
              idOfParentComment: this.replyingToCommentInfo.id
            },
            ...this.newlyPostedRepliesByAuthUser
          ];

          this.replyingToCommentInfo = null;
        }

        this.commentInput = '';
      }
    }
    catch (error) {
      this.showErrorPopup.emit(
        `There was trouble connecting to the server to add your ${commentOrReplyText}.`
      );
    }
  }
}