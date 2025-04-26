import { FollowUser } from './FollowUser.component';
import { PostDots } from './PostDots.component';
import { UserIcon } from './UserIcon.component';

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, SimpleChanges } from '@angular/core';


@Component({
  selector: 'MediaPost',
  templateUrl: '../templates/MediaPost.component.html',
  imports: [CommonModule, FollowUser, UserIcon, PostDots],
  standalone: true
})
export class MediaPost {
  @Input() authUserId!:number;
        
  @Input() postDetails!:any;
  @Input() mainPostAuthorInfo!:any;

  @Input() isFocused!:boolean;

  @Input() usersAndTheirRelevantInfo!:any;

  @Output() updatePostDetails:EventEmitter<{ overallPostId: string, isLiked?: boolean, numLikes?: number, numComments?:number,
  isSaved?: boolean }> = new EventEmitter<{ overallPostId: string, isLiked?: boolean, numLikes?: number, numComments?:number,
  isSaved?: boolean }>();

  @Output() showThreeDotsPopup:EventEmitter<any> = new EventEmitter<any>();

  @Output() showCommentsPopup:EventEmitter<{ postDetails: any, currSlide: number, mainPostAuthorInfo: any }> =
  new EventEmitter<{ postDetails: any, currSlide: number, mainPostAuthorInfo: any }>();

  @Output() showSendPostPopup:EventEmitter<string> = new EventEmitter<string>();
  @Output() showLikersPopup:EventEmitter<string> = new EventEmitter<string>();
  @Output() showErrorPopup:EventEmitter<string> = new EventEmitter<string>();
  @Output() showStoryViewer:EventEmitter<{ newStoryViewerMainUserId: number, newStoryViewerMainUsername: string,
  newStoryViewerIsFromStoriesSection:boolean }> = new EventEmitter<{ newStoryViewerMainUserId: number, newStoryViewerMainUsername:
  string, newStoryViewerIsFromStoriesSection:boolean }>();
  @Output() focusOnThisMediaPost:EventEmitter<string> = new EventEmitter<string>();

  overallPostId:string = '';

  mainPostAuthorId:number = -1;

  bgMusicIsPlaying:boolean = false;
  bgMusicObject:any = null;

  currSlide:number = 0;
  displayTaggedAccountsOfSlide:boolean = false;
  displaySectionsOfVidSlide:boolean = false;

  elementsForCaption:{ type: string, text?: string, href?: string }[] = [];

  commentInput:string = '';
  commentInputTextareaIsActive:boolean = false;

  slideToVidTimeToFrameMappings:any = {};

  heartAnimationCoordinates:number[] = [-1, -1];
  intervalIdForHeartAnimation:any = null;

  yourPostViewHasBeenAdded:boolean = false

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

    if(this.postDetails.bgMusic !== null) {
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

    this.finishSettingElementsForCaption();

    window.addEventListener('scroll', () => this.checkIfPostIsViewedAsUserScrolls());
    this.checkIfPostIsViewedAsUserScrolls();
  }


  ngOnDestroy() {
    window.removeEventListener('scroll', () => this.checkIfPostIsViewedAsUserScrolls());

    if (this.isFocused) {
      window.removeEventListener('keydown', (event) => this.handleKeyDownEventsWhenFocused(event));
    }
  }


  ngOnChanges(changes:SimpleChanges) {
    if (changes['isFocused']) {
      if (this.isFocused) {
        window.addEventListener('keydown', (event) => this.handleKeyDownEventsWhenFocused(event));
      }
      else {
        window.removeEventListener('keydown', (event) => this.handleKeyDownEventsWhenFocused(event));
      }
    }
  }


  handleKeyDownEventsWhenFocused(event:any) {
    const currSlideIsVid = this.postDetails.slides[this.currSlide].type === 'video';

    switch (event.key) {
      case 'Escape':
        if (!currSlideIsVid) {
          this.focusOnThisMediaPost.emit('');
        }
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        if (!this.commentInputTextareaIsActive && !currSlideIsVid && this.currSlide > 0) {
          this.changeSlide('decrement');
        }
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        if (!this.commentInputTextareaIsActive && !currSlideIsVid && this.currSlide + 1 < this.postDetails.slides.length) {
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
        break;
    }
  }


  checkIfPostIsViewedAsUserScrolls() {
    if (this.currSlideRef) {
      const rect = this.currSlideRef.nativeElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (rect.bottom <= viewportHeight && !this.yourPostViewHasBeenAdded) {
        this.yourPostViewHasBeenAdded = true;
        this.addViewToPost();
        window.removeEventListener('scroll', () => this.checkIfPostIsViewedAsUserScrolls());
      }
    }
  }


  formatDatetimeString(datetimeString:string) {
    const givenDatetime:any = new Date(datetimeString);
    const currentDatetime:any = new Date();
    const secondsDiff = Math.floor((currentDatetime - givenDatetime) / 1000);

    if (secondsDiff < 60) {
      return `${secondsDiff}s`;
    }
    else {
      const minutesDiff = Math.floor(secondsDiff / 60);
      if (minutesDiff < 60) {
        return `${minutesDiff}m`;
      } 
      else {
        const hoursDiff = Math.floor(minutesDiff / 60);
        if (hoursDiff < 24) {
          return `${hoursDiff}h`;
        }
        else {
          const daysDiff = Math.floor(hoursDiff/24);
          if (daysDiff < 7) {
            return `${daysDiff}d`;
          }
          else {
            const weeksDiff = Math.floor(daysDiff / 7);
            if (weeksDiff < 4) {
              return `${weeksDiff}w`;
            }
            else {
              const monthsDiff = Math.floor(daysDiff/30.417);
              if (monthsDiff < 12) {
                return `${monthsDiff}mo`;
              }
              else {
                const yearsDiff = Math.floor(monthsDiff/12);
                return `${yearsDiff}y`;
              }
            }
          }
        }
      }
    }
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


  toggleShowTaggedAccountsOfSlide() {        
    if(!this.displayTaggedAccountsOfSlide) {
      this.displaySectionsOfVidSlide = false;
      this.displayTaggedAccountsOfSlide = true;
    }
    else {
      this.displayTaggedAccountsOfSlide = false;
    }
  }


  changeSlide(incrementOrDecrementText:string) {
    this.displayTaggedAccountsOfSlide = false;
    this.displaySectionsOfVidSlide = false;

    if(incrementOrDecrementText === 'increment') {
      this.currSlide++;
    }
    else {
      this.currSlide--;
    }
  }


  finishSettingElementsForCaption() {
    const newElementsForCaption:{ type: string, text?: string, href?: string }[] = [
      { type: 'span', text: ' ' }
    ];

    let caption = this.postDetails.caption.content;

    while (caption.length > 0) {
      const indexOfNextAtSymbol = caption.indexOf('@');
      const indexOfNextHashtag = caption.indexOf('#');

      if (indexOfNextAtSymbol === -1 && indexOfNextHashtag === -1) {
        newElementsForCaption.push({ type: 'span', text: caption });
        break;
      }
      else if (indexOfNextAtSymbol === -1 || (indexOfNextHashtag !== -1 && indexOfNextHashtag < indexOfNextAtSymbol)) {
        newElementsForCaption.push({
          type: 'span',
          text: caption.substring(0, indexOfNextHashtag)
        });

        caption = caption.substring(indexOfNextHashtag);
        let indexOfSpaceAfterHashtagUsed = caption.indexOf(' ');

        if (indexOfSpaceAfterHashtagUsed === -1)
          indexOfSpaceAfterHashtagUsed = caption.length;

        const hashtagUsed = caption.substring(0, indexOfSpaceAfterHashtagUsed);
        newElementsForCaption.push({
          type: 'a',
          text: hashtagUsed,
          href: `http://34.111.89.101/search/tags/${hashtagUsed.substring(1)}`
        });

        caption = caption.substring(indexOfSpaceAfterHashtagUsed);
      }
      else {
        newElementsForCaption.push({
          type: 'span',
          text: caption.substring(0, indexOfNextAtSymbol)
        });

        caption = caption.substring(indexOfNextAtSymbol);
        let indexOfSpaceAfterMentionedUsername = caption.indexOf(' ');

        if (indexOfSpaceAfterMentionedUsername === -1)
          indexOfSpaceAfterMentionedUsername = caption.length;

        const mentionedUsername = caption.substring(0, indexOfSpaceAfterMentionedUsername);
        newElementsForCaption.push({
          type: 'a',
          text: mentionedUsername,
          href: `http://34.111.89.101/profile/${mentionedUsername.substring(1)}`
        });

        caption = caption.substring(indexOfSpaceAfterMentionedUsername);
      }
    }

    this.elementsForCaption = newElementsForCaption;
  }


  updateCommentInput(event:any) {
    this.commentInput = event.target.value;
  }


  toggleShowSectionsOfVidSlide() {
    this.displayTaggedAccountsOfSlide = false;
    this.displaySectionsOfVidSlide = !this.displaySectionsOfVidSlide;

    if (this.displaySectionsOfVidSlide && this.postDetails.slides[this.currSlide].sections.length > 0 &&
      !(this.currSlide in this.slideToVidTimeToFrameMappings)) {
        for(let sectionInfo of this.postDetails.slides[this.currSlide].sections) {
          this.getVideoFrameAtSpecifiedSlideAndTime(this.currSlide, sectionInfo[0]);
        }
      }
  }


  takeUserToSectionInVideo(timeInSeconds:number) {
    if (this.vidSlideRef.nativeElement) {
      this.vidSlideRef.nativeElement.currentTime = timeInSeconds;
      this.vidSlideRef.nativeElement.play();
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
      video.src = this.postDetails.slides[this.currSlide].src;


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


  notifyParentToShowThreeDotsPopup() {
    this.displayTaggedAccountsOfSlide = false;
    this.displaySectionsOfVidSlide = false;

    this.showThreeDotsPopup.emit(this.postDetails);
  }


  notifyParentToShowCommentsPopup() {
    this.displayTaggedAccountsOfSlide = false;
    this.displaySectionsOfVidSlide = false;

    this.showCommentsPopup.emit(
      { postDetails: this.postDetails, currSlide: this.currSlide, mainPostAuthorInfo: this.mainPostAuthorInfo }
    );
  }


  notifyParentToShowSendPostPopup() {
    this.displayTaggedAccountsOfSlide = false;
    this.displaySectionsOfVidSlide = false;
  
    this.showSendPostPopup.emit(this.overallPostId);
  }


  notifyParentToShowLikersPopup() {
    this.displayTaggedAccountsOfSlide = false;
    this.displaySectionsOfVidSlide = false;

    this.showLikersPopup.emit(this.overallPostId);
  }


  notifyParentToFocusOnThisMediaPost() {
    if (this.isFocused) {
      return;
    }

    this.focusOnThisMediaPost.emit(this.overallPostId);
  }


  async addViewToPost() {
    if (this.authUserId == -1) {
      return;
    }

    try {
      const response = await fetch(
      `http://34.111.89.101/api/Home-Page/springBootBackend2/addViewToPost/${this.authUserId}/${this.overallPostId}`, {
        method: 'POST',
        credentials: 'include'
      });
      if(!response.ok) {
        console.error(`The server had trouble adding your view to post ${this.overallPostId}`);
      }
    }
    catch (error) {
      console.error(`There was trouble connecting to the server to add your view to post ${this.overallPostId}`);
    }
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
        `http://34.111.89.101/api/Home-Page/djangoBackend2/removeSave/${this.authUserId}/${this.overallPostId}`, {
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
        `http://34.111.89.101/api/Home-Page/djangoBackend2/addSave/${this.authUserId}/${this.overallPostId}`, {
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
      this.showErrorPopup.emit('Dear Anonymous Guest, you must be logged into an account to add comments to posts');
      return;
    }

    try {
      const response = await fetch(
      `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/addCommentToPost/${this.authUserId}/${this.overallPostId}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            newComment: this.commentInput
        }),
        credentials: 'include'
      });

      if(!response.ok) {
        this.showErrorPopup.emit('The server had trouble adding your comment.');
      }
      else {
        this.updatePostDetails.emit(
          {
            overallPostId: this.overallPostId,
            numComments: this.postDetails.numComments + 1
          }
        );
        this.commentInput = '';
      }
    }
    catch (error) {
      this.showErrorPopup.emit('There was trouble connecting to the server to add your comment.');
    }
  }
}
