import { Footer } from '../components/Footer.component';
import { LeftSidebar } from '../components/LeftSidebar.component';
import { ErrorPopup } from '../components/Popups/ErrorPopup.component';
import { UserIcon } from '../components/UserIcon.component';

import { AboutAccountPopup } from '../components/Popups/AboutAccountPopup.component';
import { LeftSidebarPopup } from '../components/Popups/LeftSidebarPopup.component';
import { ThreeDotsPopup } from '../components/Popups/ThreeDotsPopup.component';

import { CommonModule } from '@angular/common';
import { Component, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'HomePage',
  standalone: true,
  imports: [
    CommonModule, LeftSidebar, LeftSidebarPopup, Footer, ErrorPopup, ThreeDotsPopup, UserIcon, AboutAccountPopup
  ],
  templateUrl: './HomePage.component.html',
  styleUrl: '../HomePageStyles.css',
})
export class HomePage {
  authUser:string = '';
  authUserId:number = -1;

  originalURL:string = '';
  numTimesRouteParamsWasWatched:number = 0;

  displayLeftSidebarPopup:boolean = false;

  displayErrorPopup:boolean = false;
  errorPopupMessage:string = '';

  displayThreeDotsPopup:boolean = false;
  threeDotsPopupPostDetails:any = {};

  displayAboutAccountPopup:boolean = true;
  aboutAccountUsername:string = 'rishavry2';
  aboutAccountUserId:number  = 4;
  aboutAccountUserIsVerified:boolean = true;
  aboutAccountUserHasStories:boolean = true;
  aboutAccountUserHasUnseenStory:boolean = true;
  aboutAccountUserProfilePhoto:string|null = 'images/defaultPfp.png';

  displayCommentsPopup:boolean = false;

  displayStoryViewer:boolean = false;
  storyViewerUsername:string = '';
  storyViewerIsFromStoriesSection:boolean = false;

  usersAndTheirRelevantInfo:any = {};

  orderedListOfPosts:Array<any> = [];

  constructor(private route: ActivatedRoute) { }


  ngOnInit(): void {
    this.originalURL = window.location.href;

    const username = this.route.snapshot.paramMap.get('username');
    if(username !== null && localStorage.getItem('defaultUsername') !== username) {
        this.authenticateUser(username, null);
    }
    else if(localStorage.getItem('defaultUsername')) {
        if (localStorage.getItem('defaultUsername') === 'Anonymous Guest') {
            this.authUser = 'Anonymous Guest';
        }
        else {
            this.authenticateUser(
              localStorage.getItem('defaultUsername') ?? '',
              parseInt(localStorage.getItem('defaultUserId') ?? '-1')
            );
        }
    }
    else {
        this.authUser = 'Anonymous Guest';
    }
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['authUser']) {
      const newVal = changes['authUser'].currentValue;
      if (newVal && newVal.length > 0) {
        localStorage.setItem('defaultUsername', newVal);
        this.fetchStories();
        this.fetchSuggestedAccounts();
        this.fetchPosts('initial');
      }
    }

    if (changes['authUserId']) {
      const newVal = changes['authUserId'].currentValue;
      if (newVal) {
        localStorage.setItem('defaultUserId', newVal);
      }
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
          this.authUser = 'Anonymous Guest';
          
          throw new Error(
            `The laravelBackend1 server had trouble getting the user-id of username ${username}`
          );
        }
        userId = await response.json();
        this.authUserId = userId ?? -1;
      }
      catch {
        this.authUser = 'Anonymous Guest';

        throw new Error(
          `There was trouble connecting to the laravelBackend1 server to get the user-id of username ${username}`
        );
      }
    }
    else {
        this.authUserId = userId;
    }

    try {
      const response1 = await fetch(`http://34.111.89.101/api/Home-Page/expressJSBackend1/authenticateUser
      /${userId}`, { credentials: 'include' });
      if (!response1.ok) {
        this.authUser = 'Anonymous Guest';
        this.authUserId = -1;

        throw new Error(
          `The expressJSBackend1 server had trouble verifying you as having the proper credentials to be 
          logged in as user ${userId}`
        );
      }

      this.authUser = username;
    }
    catch {
      this.authUser = 'Anonymous Guest';
      this.authUserId = -1;

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


  showStoryViewer(infoForStoryViewer:{username: string, isFromStoriesSection: boolean}) {
    this.storyViewerUsername = infoForStoryViewer.username;
    this.storyViewerIsFromStoriesSection = infoForStoryViewer.isFromStoriesSection;
    this.displayStoryViewer = true;
  }


  toggleDisplayLeftSidebarPopup() {
    this.displayLeftSidebarPopup = !this.displayLeftSidebarPopup;
  }


  closeAllPopups() {
    this.displayLeftSidebarPopup = false;
    this.displayErrorPopup = false;
    this.displayThreeDotsPopup = false;
    this.displayAboutAccountPopup = false;
    this.displayCommentsPopup = false;
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


  addRelevantInfoToUser(requiredInfo:{userId: number, userFieldsAndTheirValues:any}) {
    const { userId, userFieldsAndTheirValues }  = requiredInfo;
    if (!(userId in this.usersAndTheirRelevantInfo)) {
      this.usersAndTheirRelevantInfo[userId] = {};
    }

    for(let field of Object.keys(userFieldsAndTheirValues)) {
      this.usersAndTheirRelevantInfo[userId][field] = userFieldsAndTheirValues[field];
    }
  }
}
