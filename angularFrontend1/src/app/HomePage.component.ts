import { Footer } from '../components/Footer.component';
import { LeftSidebar } from '../components/LeftSidebar.component';
import { UserIcon } from '../components/UserIcon.component';
import { UserBar } from '../components/UserBar.component';
import { StoryViewer } from '../components/StoryViewer.component';

import { LeftSidebarPopup } from '../components/Popups/LeftSidebarPopup.component';
import { ErrorPopup } from '../components/Popups/ErrorPopup.component';
import { ThreeDotsPopup } from '../components/Popups/ThreeDotsPopup.component';
import { AboutAccountPopup } from '../components/Popups/AboutAccountPopup.component';
import { LikersPopup } from '../components/Popups/LikersPopup.component';
import { SendPostPopup } from '../components/Popups/SendPostPopup.component';

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BehaviorSubject } from 'rxjs';


@Component({
  selector: 'HomePage',
  standalone: true,
  imports: [
    CommonModule, LeftSidebar, LeftSidebarPopup, Footer, ErrorPopup, ThreeDotsPopup, UserIcon, AboutAccountPopup, UserBar,
    LikersPopup, SendPostPopup, StoryViewer
  ],
  templateUrl: './HomePage.component.html',
  styleUrl: '../HomePageStyles.css'
})
export class HomePage {
  authUserId:number = -1;
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

  cachedMessageSendingSuggestions:any = {};

  orderedListOfPosts:Array<any> = [];

  constructor(private route: ActivatedRoute) { }


  ngOnInit() {
    document.title = "Megagram";
    this.originalURL = window.location.href;


    this.authUserIdBS.subscribe(newAuthUserId => {
      this.authUserId = newAuthUserId;

      localStorage.setItem('defaultUserId', newAuthUserId.toString());
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
}
