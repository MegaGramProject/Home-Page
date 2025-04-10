import { UserIcon } from '../UserIcon.component';

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
  selector: 'AboutAccountPopup',
  templateUrl: '../../templates/Popups/AboutAccountPopup.component.html',
  imports: [CommonModule, UserIcon],
  standalone: true
})
export class AboutAccountPopup {
  @Input() authUserId!:number;
  @Input() userId!:number;

  @Input() username!:string;
  @Input() authUser!:string;
  @Input() userPfp!:string|null;

  @Input() userIsVerified!:boolean;
  @Input() userHasStories!:boolean;
  @Input() userHasUnseenStory!:boolean;

  @Input() usersAndTheirRelevantInfo!:object;

  @Output() addRelevantInfoToUser:EventEmitter<{userId: number, userFieldsAndTheirValues: any}> =
  new EventEmitter<{userId: number, userFieldsAndTheirValues: any}>();
  @Output() closePopup:EventEmitter<any> = new EventEmitter<any>();
  @Output() showStoryViewer:EventEmitter<{username: string, isFromStoriesSection: boolean}> =
  new EventEmitter<{username: string, isFromStoriesSection: boolean}>();

  dateJoinedText:string = '';
  accountBasedInText:string = '';


  async fetchRelevantDataForTheAccount() {
    try {
      const response = await fetch(
      'http://34.111.89.101/api/Home-Page/laravelBackend1/graphql', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            query: `query getDateJoinedAndAccountBasedInOfUser($authUserId: Int!, $userId: Int!) {
              getDateJoinedAndAccountBasedInOfUser(authUserId: $authUserId, userId: $userId)
            }`,
            variables: {
              authUserId: this.authUserId,
              userId: this.userId
            }
        }),
        credentials: 'include'
      });
      if(!response.ok) {
        this.dateJoinedText = 'The server had trouble getting the date when this user joined Megagram';
        this.accountBasedInText = 'The server had trouble getting where this user is based in';
      }
      else {
        let relevantUserInfo = await response.json();
        relevantUserInfo = relevantUserInfo.data.getDateJoinedAndAccountBasedInOfUser;
        this.dateJoinedText = this.formatDateString(relevantUserInfo[0]);
        this.accountBasedInText = relevantUserInfo[1];

        this.addRelevantInfoToUser.emit({
          userId: this.userId,
          userFieldsAndTheirValues: {
            dateJoined: this.dateJoinedText,
            accountBasedIn: this.accountBasedInText
          }
        });
      }
    }
    catch {
      this.dateJoinedText = 'There was trouble connecting to server to get the date when this user joined Megagram';
      this.accountBasedInText = 'There as trouble connecting to server to get where this user is based in';
    }
  }


  formatDateString(dateString:string) {
    if (dateString.includes("joined Megagram")) {
      return dateString;
    }

    const date = new Date(dateString);
    
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = months[date.getUTCMonth()];

    const day = date.getUTCDate();
    const year = date.getUTCFullYear();

    return `${month} ${day}, ${year}`;
  }


  takeToUsersProfile() {
    window.open(`http://34.111.89.101/profile/${this.username}`, '_blank');
  }
}
