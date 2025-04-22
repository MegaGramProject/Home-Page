import { ErrorPopup } from '../components/Popups/ErrorPopup.component';
import { StoryViewer } from '../components/StoryViewer.component';

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BehaviorSubject } from 'rxjs';


@Component({
  selector: 'StoryViewerPage',
  standalone: true,
  imports: [CommonModule, StoryViewer, ErrorPopup],
  templateUrl: './StoryViewerPage.component.html'
})
export class StoryViewerPage {
  authUsernameWasProvidedInRoute:boolean = false;

  authUserId:number = -1;
  authUserIdBS:BehaviorSubject<number> = new BehaviorSubject<number>(-1);
  authUsername:string = '';
  authUsernameBS:BehaviorSubject<string> = new BehaviorSubject<string>('');

  storyId:number = -1;
  storyAuthorId:number = -1;
  storyAuthorUsername:string = '';

  displayErrorPopup:boolean = false;
  errorPopupMessage:string = '';

  storyFetchingError:boolean = false;
  storyFetchingIsComplete:boolean = false;

  viewedStoryIds:Set<number> = new Set<number>();
  usernamesWhoseStoriesYouHaveFinished:Set<string> = new Set<string>();

  usersAndTheirRelevantInfo:any = {};
  usersAndTheirStories:any = {};
  usersAndYourCurrSlideInTheirStories:any = {};
  vidStoriesAndTheirPreviewImages:any = {};


  constructor(private route: ActivatedRoute) { }


  ngOnInit(): void {
    document.title = "Stories";


    this.authUserIdBS.subscribe(newAuthUserId => {
      this.authUserId = newAuthUserId;

      localStorage.setItem('defaultUserId', newAuthUserId.toString());
    });


    this.authUsernameBS.subscribe(newAuthUsername => {
      this.authUsername = newAuthUsername;

      if (newAuthUsername.length > 0) {
        localStorage.setItem('defaultUsername', newAuthUsername);
        this.fetchTheNecessaryInfo();
      }
    });


    const authorUsernameOrStoryIdFromRouteParams = this.route.snapshot.paramMap.get('authorUsernameOrStoryId');

    if (typeof authorUsernameOrStoryIdFromRouteParams === 'string') {
      this.storyAuthorUsername = authorUsernameOrStoryIdFromRouteParams;
    }
    else if (typeof authorUsernameOrStoryIdFromRouteParams === 'number') {
      this.storyId = authorUsernameOrStoryIdFromRouteParams;
    }

    const authUsernameFromRouteParams = this.route.snapshot.paramMap.get('authUsername');

    if (authUsernameFromRouteParams!==null) {
      this.authUsernameWasProvidedInRoute = true;
    }

    if (authUsernameFromRouteParams!==null && localStorage.getItem('defaultUsername') !== authUsernameFromRouteParams) {
      this.authenticateUser(authUsernameFromRouteParams, null);
    }
    else if (localStorage.getItem('defaultUsername')) {
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


  closeStoryViewer() {
    window.location.href = 'http://34.111.89.101/';
  }


  showErrorPopup(errorMessage:string) {
    this.errorPopupMessage = errorMessage;
    this.displayErrorPopup = true;
  }


  closeErrorPopup() {
    this.displayErrorPopup = false;

    if(this.storyFetchingError) {
      window.location.href = 'http://34.111.89.101/';
    }
  }


  updateUsersAndTheirStories(newUsersAndTheirStories:any) {
    this.usersAndTheirStories = newUsersAndTheirStories;
  }


  updateUsersAndTheirStoryPreviews(newUsersAndTheirStoryPreviews:any)  {
    newUsersAndTheirStoryPreviews;
  }


  updateUsersAndYourCurrSlideInTheirStories(newUsersAndYourCurrSlideInTheirStories:any) {
    this.usersAndYourCurrSlideInTheirStories = newUsersAndYourCurrSlideInTheirStories;
  }


  updateVidStoriesAndTheirPreviewImages(newVidStoriesAndTheirPreviewImages:any) {
    this.vidStoriesAndTheirPreviewImages = newVidStoriesAndTheirPreviewImages;
  }


  addUsernameToSetOfUsersWhoseStoriesYouHaveFinished(newUsername:string) {
    newUsername; //do nothing
  }


  addStoryIdToSetOfViewedStoryIds(newlyViewedStoryId:number) {
    this.viewedStoryIds = new Set(
      [
        ...this.viewedStoryIds, 
        newlyViewedStoryId
      ]
    );
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


  async fetchTheNecessaryInfo() {
    const newUsersAndTheirRelevantInfo:any = {};
    const newUsersAndTheirStories:any = {};
    const newUsersAndYourCurrSlideInTheirStories:any = {};
    
    let storyAuthorUsernameValue = '';
    let storyAuthorIdValue:any = -1;
    const authUserIdValue = this.authUserId;
    const storyIdValue = this.storyId;

    if (this.storyAuthorUsername.length == 0) {
      try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/springBootBackend2/getStoryById/${authUserIdValue}/${storyIdValue}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          this.storyFetchingError = true;
          this.storyFetchingIsComplete = true;
          this.showErrorPopup(`The server had trouble providing story ${storyIdValue}`);
          return;
        }
        else {
          const userStoryData = await response.json();

          storyAuthorIdValue = userStoryData.authorId; 
          this.storyAuthorId = storyAuthorIdValue;

          if (userStoryData.authorUsername == null) {
            storyAuthorUsernameValue = `user ${storyAuthorIdValue}`
          }
          else {
            storyAuthorUsernameValue = userStoryData.authorUsername;
          }
          this.storyAuthorUsername = storyAuthorUsernameValue;

          if (userStoryData.currSlide == -1) {
            this.storyFetchingError = true;
            this.storyFetchingIsComplete = true;
            this.showErrorPopup(`User ${storyAuthorUsernameValue} does not currently have any unexpired stories`);
            return;
          }

          if (!(storyAuthorIdValue in newUsersAndTheirRelevantInfo)) {
              newUsersAndTheirRelevantInfo[storyAuthorIdValue] = {};
          }
          newUsersAndTheirRelevantInfo[storyAuthorIdValue].username = storyAuthorUsernameValue;

          const userStories:any[] = userStoryData.stories;

          newUsersAndTheirStories[storyAuthorIdValue] = userStories.map(userStory => {
            userStory.datetime = this.formatDatetimeString(userStory.datetime);
            return userStory
          });

          if (userStoryData.currSlide === 'finished') {
              newUsersAndYourCurrSlideInTheirStories[storyAuthorIdValue] = 0;
          }
          else {
              newUsersAndYourCurrSlideInTheirStories[storyAuthorIdValue] = userStoryData.currSlide;
          }
        }
      }
      catch (error) {
        this.storyFetchingError = true;
        this. storyFetchingIsComplete = true;
        this.showErrorPopup(
          `There was trouble connecting to the server to provide story ${storyIdValue}`
        );
        return;
      }
    }
    else {
      storyAuthorUsernameValue = this.storyAuthorUsername;
    }
    
    if (storyIdValue == -1) {
      try {
        const response1 = await fetch('http://34.111.89.101/api/Home-Page/laravelBackend1/graphql', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            query: `query getUserIdOfUsername($username: String!) {
              getUserIdOfUsername(username: $username)
            }`,
            variables: {
              username: storyAuthorUsernameValue
            }
          }),
          credentials: 'include'
        });

        if (!response1.ok) {
          this.storyFetchingError = true;
          this.storyFetchingIsComplete = true;
          this.showErrorPopup(
            `The server had trouble getting the user-id of username ${storyAuthorUsernameValue}`
          );
          return;
        }
        else {
          storyAuthorIdValue = await response1.json();
          storyAuthorIdValue = storyAuthorIdValue.data.getUserIdOfUsername;
          
          this.storyAuthorId = storyAuthorIdValue;
          
          if (!(storyAuthorIdValue in newUsersAndTheirRelevantInfo)) {
            newUsersAndTheirRelevantInfo[storyAuthorIdValue] = {};
          }
          newUsersAndTheirRelevantInfo[storyAuthorIdValue].username = storyAuthorUsernameValue;
        }
      }
      catch {
        this.storyFetchingError = true;
        this.storyFetchingIsComplete = true;
        this.showErrorPopup(
          `There was trouble connecting to the server to get the user-id of username ${storyAuthorUsernameValue}`
        );
        return;
      }

      try {
        const response2 = await fetch(
        `http://34.111.89.101/api/Home-Page/springBootBackend2/getStoriesOfUser/${authUserIdValue}
        /${storyAuthorIdValue}`, {
          credentials: 'include'
        });

        if (!response2.ok) {
          this.storyFetchingError = true;
          this.storyFetchingIsComplete = true;
          this.showErrorPopup(`The server had trouble providing the stories of user ${storyAuthorUsernameValue}`);
          return;
        }
        else {
          const userStoryData = await response2.json();

          if (userStoryData.currSlide == -1) {
            this.storyFetchingError = true;
            this.storyFetchingIsComplete = true;
            this.showErrorPopup(`User ${storyAuthorUsernameValue} does not currently have any unexpired stories`);
            return;
          }

          const userStories:any[] = userStoryData.stories;

          newUsersAndTheirStories[storyAuthorIdValue] = userStories.map(userStory => {
            userStory.datetime = this.formatDatetimeString(userStory.datetime);
            return userStory
          });
          
          const newViewedStoryIds = new Set([...this.viewedStoryIds]);

          if (userStoryData.currSlide === 'finished') {
            newUsersAndYourCurrSlideInTheirStories[storyAuthorIdValue] = 0;

            for(let story of userStoryData.stories) {
              newViewedStoryIds.add(story.id)
            }
          }
          else {
            newUsersAndYourCurrSlideInTheirStories[storyAuthorIdValue] = userStoryData.currSlide;

            for(let story of userStoryData.stories) {
              newViewedStoryIds.add(story.id)
              
              if (story.id == userStoryData.currSlide) {
                break;
              }
            }
          }

          this.viewedStoryIds = newViewedStoryIds;
        }
      }
      catch (error) {
        this.storyFetchingError = true;
        this.storyFetchingIsComplete = true;
        this.showErrorPopup(
          `There was trouble connecting to the server to provide the stories of user ${storyAuthorUsernameValue}`
        );
        return;
      }
    }

    try {
      const response3 = await fetch(
      `http://34.111.89.101/api/Home-Page/laravelBackend1/getVerificationStatusOfUser/${authUserIdValue}
      /${storyAuthorIdValue}`);

      if (!response3.ok) {
        console.error(
          `The server had trouble getting the verification-status of user ${storyAuthorUsernameValue}`
        );

        newUsersAndTheirRelevantInfo[storyAuthorIdValue].isVerified = false;
      }
      else {
        newUsersAndTheirRelevantInfo[storyAuthorIdValue].isVerified = await response3.json();
      }
    }
    catch (error) {
      console.error(
        `There was trouble connecting to the server to get the verification-status of user
        ${storyAuthorUsernameValue}`
      );

      newUsersAndTheirRelevantInfo[storyAuthorIdValue].isVerified = false;
    }

    try {
      const response4 = await fetch(
      `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getProfilePhotoOfUser/${authUserIdValue}
      /${storyAuthorIdValue}`);
      if (!response4.ok) {
        console.error(
          `The server had trouble getting the profile-photo of user ${storyAuthorUsernameValue}`
        );

        newUsersAndTheirRelevantInfo[storyAuthorIdValue].profilePhoto = 'images/defaultPfp.png';
      }
      else {
        const profilePhotoBlobOfUser = await response4.blob();
        newUsersAndTheirRelevantInfo[storyAuthorIdValue].profilePhoto = URL.createObjectURL(profilePhotoBlobOfUser);
      }
    }
    catch (error) {
      console.error(
        `There was trouble connecting to the server to get the profile-photo of user ${storyAuthorUsernameValue}`
      );

      newUsersAndTheirRelevantInfo[storyAuthorIdValue].profilePhoto = 'images/defaultPfp.png';
    }

    this.usersAndTheirRelevantInfo = newUsersAndTheirRelevantInfo;
    this.usersAndTheirStories = newUsersAndTheirStories;
    this.usersAndYourCurrSlideInTheirStories = newUsersAndYourCurrSlideInTheirStories;

    this.storyFetchingIsComplete = true;
  }
}
