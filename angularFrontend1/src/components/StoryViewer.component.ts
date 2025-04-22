import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

import { BehaviorSubject } from 'rxjs';


@Component({
  selector: 'StoryViewer',
  templateUrl: '../templates/StoryViewer.component.html',
  imports: [CommonModule],
  standalone: true
})
export class StoryViewer {
  @Input() authUserId!:number;
  @Input() authUsername!:string;
  @Input() authUsernameWasProvidedInRoute!:boolean;
  @Input() storyAuthorUsername!:string;
  @Input() storyAuthorId!:number;

  @Input() zIndex!:string;

  @Input() orderedListOfUserIdsInStoriesSection!:number[];
  @Input() orderedListOfUsernamesInStoriesSection!:string[];
  @Input() orderedListOfSponsorshipStatusesInStoriesSection!:boolean[];
  @Input() isFromStoriesSection!:boolean;

  @Input() usersAndTheirStories!:any;
  @Input() usersAndTheirStoryPreviews!:any;
  @Input() usersAndYourCurrSlideInTheirStories!:any;
  @Input() vidStoriesAndTheirPreviewImages!:any;
  @Input() usersAndTheirRelevantInfo!:any;

  @Input() usernamesWhoseStoriesYouHaveFinished!:Set<string>;
  @Input() viewedStoryIds!:Set<number>;

  @Output() updateUsersAndTheirStories:EventEmitter<any> = new EventEmitter<any>();
  @Output() updateUsersAndTheirStoryPreviews:EventEmitter<any> = new EventEmitter<any>();
  @Output() updateUsersAndYourCurrSlideInTheirStories:EventEmitter<any> = new EventEmitter<any>();
  @Output() updateVidStoriesAndTheirPreviewImages:EventEmitter<any> = new EventEmitter<any>();
  @Output() addUsernameToSetOfUsersWhoseStoriesYouHaveFinished:EventEmitter<string> = new EventEmitter<string>();
  @Output() addStoryIdToSetOfViewedStoryIds:EventEmitter<number> = new EventEmitter<number>();
  @Output() closeStoryViewer:EventEmitter<any> = new EventEmitter<any>();
  @Output() showErrorPopup:EventEmitter<string> = new EventEmitter<string>();

  currStoryAuthorUsername:string = '';
  currStoryAuthorUsernameBS:BehaviorSubject<string> = new BehaviorSubject<string>('');
  currStoryAuthorId:any = -1;

  currStories:any[] = [];
  currStoriesBS:BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  currSlide:number = -1;
  numSlides:number = -1;
  currIndexInStoriesSection:number = -1;

  currSlideProgressPercent:number = -1;
  currSlideProgressPercentBS:BehaviorSubject<number> = new BehaviorSubject<number>(-1);
  rateOfStoryProgression:number = -1;
  rateOfStoryProgressionBS:BehaviorSubject<number> = new BehaviorSubject<number>(-1);
  intervalIdForStoryProgression:any = null;

  filteredAbsoluteDiffsForLeftSidePreviews:number[] = [];
  filteredAbsoluteDiffsForRightSidePreviews:number[] = [];

  displaySentText:boolean = false;

  replyToStoryTextareaIsActive:boolean = false;
  replyToStoryInput:string = '';

  isMuted:boolean = true;
  isCurrentlyFetchingStory:boolean = false;

  storyFetchingErrorMessage:string = '';

  @ViewChild('videoSlideRef') videoSlideRef!:ElementRef;


  ngOnInit() {
    this.currStoryAuthorUsernameBS.subscribe(newCurrStoryAuthorUsername => {
      this.currStoryAuthorUsername = newCurrStoryAuthorUsername;

      if (newCurrStoryAuthorUsername.length>0) {
        this.numSlides = 0;
  
        if(this.isFromStoriesSection) {
          const newCurrIndexInStoriesSection = this.orderedListOfUsernamesInStoriesSection.indexOf(newCurrStoryAuthorUsername);
          this.currIndexInStoriesSection = newCurrIndexInStoriesSection;
          this.currStoryAuthorId = this.orderedListOfUserIdsInStoriesSection[newCurrIndexInStoriesSection];

          this.filteredAbsoluteDiffsForLeftSidePreviews =  [2, 1].filter(value => newCurrIndexInStoriesSection - value > -1);
          this.filteredAbsoluteDiffsForRightSidePreviews = [1, 2].filter(
            value => newCurrIndexInStoriesSection + value < this.orderedListOfUserIdsInStoriesSection.length
          );
        }
        else {
          for(let userId of Object.keys(this.usersAndTheirRelevantInfo)) {
            if('username' in this.usersAndTheirRelevantInfo[userId] && this.usersAndTheirRelevantInfo[userId].username === 
            newCurrStoryAuthorUsername) {
              this.currStoryAuthorId = userId;
              break;
            }
          }
        }

        this.fetchTheNecessaryStories();
      }
    });

    
    this.currStoriesBS.subscribe(newCurrStories => {
      this.currStories = newCurrStories;

      this.numSlides = newCurrStories.length;
    });


    this.rateOfStoryProgressionBS.subscribe(newRateOfStoryProgression => {
      this.rateOfStoryProgression = newRateOfStoryProgression;

      clearInterval(this.intervalIdForStoryProgression);

      if(newRateOfStoryProgression>0) {
        this.intervalIdForStoryProgression = setInterval(() => this.updateStoryProgression(), 25);
      }
      else {
        this.intervalIdForStoryProgression = null;
      }
    });


    this.currSlideProgressPercentBS.subscribe(newCurrSlideProgressPercent => {
      this.currSlideProgressPercent = newCurrSlideProgressPercent;

      if (newCurrSlideProgressPercent >= 100) {
        this.currSlide++;
        this.handleChangeInStory();
      }
    });

    this.currStoryAuthorUsernameBS.next(this.storyAuthorUsername);
    this.currStoryAuthorId = this.storyAuthorId;

    window.addEventListener('keydown', (event) => this.handleKeyDownEvents(event));
  }


  ngOnDestroy() {
    window.removeEventListener('keydown', (event) => this.handleKeyDownEvents(event));
  }


  //the method below is called right after the value of currSlide/currStories changes.
  async handleChangeInStory() {
    this.rateOfStoryProgressionBS.next(0);
    this.currSlideProgressPercentBS.next(0);

    let currSlideValue = this.currSlide;
    let currStoriesValue = this.currStories;
    let currStoryAuthorUsernameValue = this.currStoryAuthorUsername;
    let currStoryAuthorIdValue = this.currStoryAuthorId;
    let currIndexInStoriesSectionValue = this.currIndexInStoriesSection;

    let newUsersAndYourCurrSlideInTheirStories = {...this.usersAndYourCurrSlideInTheirStories};

    if(currSlideValue >= currStoriesValue.length) {
      newUsersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue] = 0;
      this.updateUsersAndYourCurrSlideInTheirStories.emit(newUsersAndYourCurrSlideInTheirStories);

      if (!(this.usernamesWhoseStoriesYouHaveFinished.has(currStoryAuthorUsernameValue))) {
        this.addUsernameToSetOfUsersWhoseStoriesYouHaveFinished.emit(currStoryAuthorUsernameValue);
      }

      if (this.isFromStoriesSection && currIndexInStoriesSectionValue + 1 < this.orderedListOfUsernamesInStoriesSection.length) {
        currStoryAuthorUsernameValue = this.orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue + 1];
        this.currStoryAuthorUsernameBS.next(currStoryAuthorUsernameValue);
      }
      else {
        this.closeStoryViewer.emit();
      }
    }
    else if (currSlideValue > -1) {
      const currStoryId = currStoriesValue[currSlideValue].id;

      if(this.authUsernameWasProvidedInRoute) {
        window.history.pushState(
          { page: 'stories' },
          'Stories',
          `/stories/${this.authUsername}/${currStoryId}`
        );
      }
      else {
        window.history.pushState(
          { page: 'stories' },
          'Stories',
          `/stories/${currStoryId}`
        );
      }

      if(!(this.viewedStoryIds.has(currStoryId))) {
        this.markStoryIdAsViewed(currStoryId);
      }

      if(currStoriesValue[currSlideValue].vidDurationInSeconds==null) {
        this.rateOfStoryProgressionBS.next(0.5);
      } 
      else {
        this.rateOfStoryProgressionBS.next(2.5/currStoriesValue[currSlideValue].vidDurationInSeconds);
      }

      const yourNextSlideOfCurrStoryAuthor = currSlideValue + 1 < currStoriesValue.length ? currSlideValue + 1 : 0;

      newUsersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue] = yourNextSlideOfCurrStoryAuthor;     
      this.updateUsersAndYourCurrSlideInTheirStories.emit(newUsersAndYourCurrSlideInTheirStories);

      const yourNextStoryOfCurrStoryAuthor = currStoriesValue[yourNextSlideOfCurrStoryAuthor];
      const newUsersAndTheirStoryPreviews = {...this.usersAndTheirStoryPreviews};

      if (yourNextStoryOfCurrStoryAuthor.vidDurationInSeconds == null) {
        newUsersAndTheirStoryPreviews[currStoryAuthorIdValue] = yourNextStoryOfCurrStoryAuthor.src;
      }
      else {
        if (!(yourNextStoryOfCurrStoryAuthor.id in this.vidStoriesAndTheirPreviewImages)) {
          const newVidStoriesAndTheirFirstFrames = {...this.vidStoriesAndTheirPreviewImages};
          newVidStoriesAndTheirFirstFrames[yourNextStoryOfCurrStoryAuthor.id] = await this.getFirstFrameForPreviewImgOfVid(
            yourNextStoryOfCurrStoryAuthor.src
          );
          this.updateVidStoriesAndTheirPreviewImages.emit(newVidStoriesAndTheirFirstFrames);
        }

        newUsersAndTheirStoryPreviews[currStoryAuthorIdValue] = this.vidStoriesAndTheirPreviewImages[
          yourNextStoryOfCurrStoryAuthor.id
        ];
      }

      this.updateUsersAndTheirStoryPreviews.emit(newUsersAndTheirStoryPreviews);
    }
    else if (this.isFromStoriesSection && currIndexInStoriesSectionValue - 1 > -1) {
      currStoryAuthorUsernameValue = this.orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue - 1];
      this.currStoryAuthorUsernameBS.next(currStoryAuthorUsernameValue);
    }
    else {
      this.closeStoryViewer.emit();
    }
  }


  updateStoryProgression() {
    if (this.currSlideProgressPercent + this.rateOfStoryProgression > 100) {
      this.currSlideProgressPercentBS.next(100);
    }
    else {
      this.currSlideProgressPercentBS.next(this.currSlideProgressPercent + this.rateOfStoryProgression);
    }
  }


  incrementOrDecrementSlideByOne(incrementOrDecrementText:string) {
    if (incrementOrDecrementText === 'increment') {
      this.currSlide++;
      this.handleChangeInStory();
    }
    else {
      this.currSlide--;
      this.handleChangeInStory();
    }
  }


  takeAuthUserToTheSelectedUsersStoryInStorySection(newCurrIndexInStoriesSection:number) {
    this.currStoryAuthorUsernameBS.next(this.orderedListOfUsernamesInStoriesSection[newCurrIndexInStoriesSection]);
  }


  togglePause() {
    if(this.rateOfStoryProgression == 0) {
      this.resumeStoryProgression();
    }
    else {
      this.pauseStoryProgression();
    }
  }


  pauseStoryProgression() {
    this.rateOfStoryProgressionBS.next(0);

    const vidSlideElement = this.videoSlideRef?.nativeElement;

    if(vidSlideElement) {
      vidSlideElement.pause();
    }
  }


  resumeStoryProgression() {
    if(this.currStories[this.currSlide].vidDurationInSeconds==null) {
      this.rateOfStoryProgressionBS.next(0.5);
    }
    else {
      this.rateOfStoryProgressionBS.next(2.5/this.currStories[this.currSlide].vidDurationInSeconds);
      
      const vidSlideElement = this.videoSlideRef?.nativeElement;

      if(vidSlideElement) {
        vidSlideElement.play();
      }
    }
  }


  updateReplyToStoryInput(event:any) {
    this.replyToStoryInput = event.target.value;
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


  toggleIsMuted() {
    const vidSlideElement = this.videoSlideRef?.nativeElement;

    if(vidSlideElement) {
      vidSlideElement.muted = !this.isMuted;
      this.isMuted = !this.isMuted;
    }
  }


  async getFirstFrameForPreviewImgOfVid(videoBase64String:string) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.src = videoBase64String;


      video.addEventListener('loadeddata', () => {
        video.currentTime = 0;
      });


      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageDataURL = canvas.toDataURL('image/png');
        resolve(imageDataURL);
      });


      video.onerror = (e) => {
        e;
        reject(new Error('Error loading video'));
      };
    });
  }


  handleOnBlurOfReplyToStoryTextInput() {
    setTimeout(() => this.replyToStoryTextareaIsActive = false, 300);
    this.resumeStoryProgression();
  }


  handleKeyDownEvents(event:any) {
    switch (event.key) {
      case 'Escape':
        this.closeStoryViewer.emit();
        break;
      case 'ArrowLeft':
        this.incrementOrDecrementSlideByOne('decrement');
          break;
      case 'ArrowRight':
        this.incrementOrDecrementSlideByOne('increment');
          break;
      case 'ArrowUp':
        this.incrementOrDecrementSlideByOne('decrement');
          break;
      case 'ArrowDown':
        this.incrementOrDecrementSlideByOne('increment');
        break;
      case 'm':
      case 'M':
        if (!this.replyToStoryTextareaIsActive) {
          this.toggleIsMuted();
        }
        break;
      case 'k':
      case 'K':
        if (!this.replyToStoryTextareaIsActive) {
          this.togglePause();
        }
        break;
      case ' ':
        this.togglePause();
        break;
    }
  }


  async markStoryIdAsViewed(storyId:number) {
    if (this.authUserId == -1) {
      return;
    } 

    try {
      const response = await fetch(
      `http://34.111.89.101/api/Home-Page/springBootBackend2/markStoryAsViewed/${this.authUserId}/${storyId}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        console.error(`The springBootBackend2 server had trouble mark story ${storyId} as viewed`);
      }
      else {
        this.addStoryIdToSetOfViewedStoryIds.emit(storyId);
      }
    }
    catch {
      console.error(`There was trouble connecting to the springBootBackend2 server to mark story ${storyId} as viewed`);
    }
  }


  async sendReplyToStory(replyToSend:string) {
    if (replyToSend.length == 0) {
      return;
    }
    
    if (this.authUserId == -1) {
      this.showErrorPopup.emit('Dear Anonymous Guest, you must be logged into an account to send replies to stories');
      return;
    } 

    try {
      const response = await fetch(
      `http://34.111.89.101/api/Home-Page/springBootBackend2/sendMessageToIndividualUser/${this.authUserId}
      /${this.currStoryAuthorId}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            messageToSend: `Replied to story ${this.currStories[this.currSlide].id}: ${replyToSend}`
        }),
        credentials: 'include'
      });
      if (!response.ok) {
        this.showErrorPopup.emit(
          'The server had trouble sending your reply to this story'
        );
      }
      else {
        this.replyToStoryInput = '';
        this.displaySentText = true;
        setTimeout(() => this.displaySentText = false, 850);

        this.replyToStoryTextareaIsActive = false;
        this.resumeStoryProgression();
      }
    }
    catch {
      this.showErrorPopup.emit(
        'There was trouble connecting to the server to send your reply to this story'
      );
    }
  }


  async deleteStory() {
    let idOfStoryToDelete = this.currStories[this.currSlide].id;

    try {  
      const response = await fetch(
      `http:/34.111.89.101/api/Home-Page/springBootBackend2/deleteStory/${this.authUserId}/${idOfStoryToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        this.showErrorPopup.emit('The server had trouble deleting this story of yours');
      }
      else {
        const newCurrStories = this.currStories.filter(story => story.id !== idOfStoryToDelete);
        this.currStoriesBS.next(newCurrStories);

        const newUsersAndTheirStories = {...this.usersAndTheirStories};
        newUsersAndTheirStories[this.authUserId] = newCurrStories;
        this.updateUsersAndTheirStories.emit(newUsersAndTheirStories);

        this.handleChangeInStory();
      }
    }
    catch {
      this.showErrorPopup.emit('There was trouble connecting to the server to delete this story of yours');
    }
  }


  async fetchTheNecessaryStories() {
    this.currStoriesBS.next(this.usersAndTheirStories[this.currStoryAuthorId]);
    this.currSlide = this.usersAndYourCurrSlideInTheirStories[this.currStoryAuthorId];

    this.handleChangeInStory();
    return;

    this.isCurrentlyFetchingStory = true;

    const newUsersAndYourCurrSlideInTheirStories = {...this.usersAndYourCurrSlideInTheirStories};

    if (this.isFromStoriesSection) {
      const userIdsNeededForStoryPreviewFetching = [];
      const currIndexInStoriesSectionValue = this.currIndexInStoriesSection;
      const userIdsAndTheirUsernames:any = {};

      if (currIndexInStoriesSectionValue + 1 < this.orderedListOfUserIdsInStoriesSection.length &&
      !(this.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue + 1] in this.usersAndTheirStoryPreviews)) {
        const userId = this.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue + 1];
        const username =  this.orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue + 1];

        userIdsNeededForStoryPreviewFetching.push(userId);
        userIdsAndTheirUsernames[userId] = username;
      }

      if (currIndexInStoriesSectionValue + 2 < this.orderedListOfUserIdsInStoriesSection.length &&
      !(this.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue + 2] in this.usersAndTheirStoryPreviews)) {
        const userId = this.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue + 2];
        const username =  this.orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue + 2];

        userIdsNeededForStoryPreviewFetching.push(userId);
        userIdsAndTheirUsernames[userId] = username;
      }

      if (currIndexInStoriesSectionValue - 1 > -1 &&
      !(this.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue - 1] in this.usersAndTheirStoryPreviews)) {
        const userId = this.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue - 1];
        const username =  this.orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue - 1];

        userIdsNeededForStoryPreviewFetching.push(userId);
        userIdsAndTheirUsernames[userId] = username;
      }

      if (currIndexInStoriesSectionValue - 2 > -1 &&
      !(this.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue - 2] in this.usersAndTheirStoryPreviews)) {
        const userId = this.orderedListOfUserIdsInStoriesSection[currIndexInStoriesSectionValue - 2];
        const username =  this.orderedListOfUsernamesInStoriesSection[currIndexInStoriesSectionValue - 2];
        
        userIdsNeededForStoryPreviewFetching.push(userId);
        userIdsAndTheirUsernames[userId] = username;
      }
      
      if (userIdsNeededForStoryPreviewFetching.length>0) {
        try {
          const response = await fetch(
          `http://34.111.89.101/api/Home-Page/springBootBackend2/getStoryPreviewsOfAtMost4Users/${this.authUserId}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              userIds: userIdsNeededForStoryPreviewFetching
            }),
            credentials: 'include'
          });
          if (!response.ok) {
            console.error('The server had trouble providing some of the required story-previews');
          }
          else {
            const usersAndTheInfoOnTheirStoryPreviews = await response.json();
            const newUsersAndTheirStoryPreviews = {...this.usersAndTheirStoryPreviews};
            
            for(let userId of Object.keys(usersAndTheInfoOnTheirStoryPreviews)) {
              newUsersAndTheirStoryPreviews[userId] = usersAndTheInfoOnTheirStoryPreviews[userId].previewImg;

              if (usersAndTheInfoOnTheirStoryPreviews[userId].currSlide === 'finished') {
                newUsersAndYourCurrSlideInTheirStories[userId] = 0;
                this.addUsernameToSetOfUsersWhoseStoriesYouHaveFinished.emit(userIdsAndTheirUsernames[userId]);
              }
              else {
                newUsersAndYourCurrSlideInTheirStories[userId] = usersAndTheInfoOnTheirStoryPreviews[userId]
                .currSlide;
              }
            }

            this.updateUsersAndTheirStoryPreviews.emit(newUsersAndTheirStoryPreviews);
          }
        }
        catch (error) {
          console.error('There was trouble connecting to the server to provide some of the required story-previews');
        }
      }
    }

    const currStoryAuthorIdValue = this.currStoryAuthorId;
    const currStoryAuthorUsernameValue = this.currStoryAuthorUsername;
    const authUserIdValue = this.authUserId;

    if(!(currStoryAuthorIdValue in this.usersAndTheirStories)) {
      try {
        const response1 = await fetch(
        `http://34.111.89.101/api/Home-Page/springBootBackend2/getStoriesOfUser/${authUserIdValue}
        /${currStoryAuthorIdValue}`, {
            credentials: 'include'
        });

        if (!response1.ok) {
          this.storyFetchingErrorMessage = `The server had trouble getting the stories of ${currStoryAuthorUsernameValue}`;
        }
        else {
          const userStoryData:any = await response1.json();

          const userStories:any[] = userStoryData.stories;

          userStoryData.stories = userStories.map(userStory => {
            userStory.datetime = this.formatDatetimeString(userStory.datetime);
            return userStory
          });

          const newUsersAndTheirStories = {...this.usersAndTheirStories};
          newUsersAndTheirStories[currStoryAuthorIdValue] = userStoryData.stories;
          this.updateUsersAndTheirStories.emit(newUsersAndTheirStories);

          this.currStoriesBS.next(userStoryData.stories);

          if (userStoryData.currSlide === 'finished') {
            this.currSlide = 0;

            newUsersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue] = 0;

            this.addUsernameToSetOfUsersWhoseStoriesYouHaveFinished.emit(currStoryAuthorUsernameValue);

            for(let story of userStoryData.stories) {
              this.addStoryIdToSetOfViewedStoryIds.emit(story.id);
            }

            this.handleChangeInStory();
          }
          else if (userStoryData.currSlide == -1) {
            this.storyFetchingErrorMessage = `User ${currStoryAuthorUsernameValue} does not currently have any
            unexpired stories`;
          }
          else {
            this.currSlide = userStoryData.currSlide;

            newUsersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue] = userStoryData.currSlide;
            
            for(let i=0; i<userStoryData.stories.length; i++) {
              if (i == userStoryData.currSlide) {
                break;
              }

              const story = userStoryData.stories[i];
              this.addStoryIdToSetOfViewedStoryIds.emit(story.id);
            }

            this.handleChangeInStory();
          }
        }
      }
      catch (error) {
        this.storyFetchingErrorMessage = `There was trouble connecting to the server to get the stories of
        ${currStoryAuthorUsernameValue}`;
      }
    }
    else {
      this.currStoriesBS.next(this.usersAndTheirStories[currStoryAuthorIdValue]);
      this.currSlide = this.usersAndYourCurrSlideInTheirStories[currStoryAuthorIdValue];

      this.handleChangeInStory();
    }

    this.updateUsersAndYourCurrSlideInTheirStories.emit(newUsersAndYourCurrSlideInTheirStories);

    this.isCurrentlyFetchingStory = false;
  }
}