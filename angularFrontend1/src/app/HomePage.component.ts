import { LeftSidebar } from '../components/LeftSidebar.component';
import { LeftSidebarPopup } from '../components/LeftSidebarPopup.component';

import { CommonModule } from '@angular/common';
import { Component, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'HomePage',
  standalone: true,
  imports: [
    CommonModule, LeftSidebar, LeftSidebarPopup
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

  errorPopupMessage:string = '';
  displayErrorPopup:boolean = false;


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
      /${userId}`);
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


  toggleDisplayLeftSidebarPopup() {
    this.displayLeftSidebarPopup = !this.displayLeftSidebarPopup;
  }


  closeAllPopups() {
    this.displayLeftSidebarPopup = false;
    this.displayErrorPopup = false;
  }


  showErrorPopup(newErrorPopupMessage:string) {
    this.errorPopupMessage = newErrorPopupMessage;
    this.displayErrorPopup = true;
  }


  closeErrorPopup() {
    this.displayErrorPopup = false;
  }
}
