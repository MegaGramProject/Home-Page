import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
  selector: 'AccountPreview',
  templateUrl: '../templates/AccountPreview.component.html',
  imports: [CommonModule],
  standalone: true
})
export class AccountPreview {
  @Input() username!:string;
  @Input() userPfp!:string;
  @Input() userFullName!:string;
  @Input() toggleFollowText!:string;

  @Input() authUserId!:number;
  @Input() userId!:number;
  @Input() numPosts!:number;
  @Input() numFollowers!:number;
  @Input() numFollowings!:number;

  @Input() userIsVerified!:boolean;

  @Input() userIsPrivate!:any;

  @Output() updateFollowText:EventEmitter<string> = new EventEmitter<string>();
  @Output() showErrorPopup:EventEmitter<string> = new EventEmitter<string>();


  formatNumber(number:any) {
    if(number==='?') {
      return '?';
    }
    else if (number < 10000) {
      return number.toLocaleString();
    }
    else if (number >= 10000 && number < 1000000) {
      return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    else if (number >= 1000000 && number < 1000000000) {
      return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    else if (number >= 1000000000 && number < 1000000000000) {
      return (number / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    else {
      return (number / 1000000000000).toFixed(1).replace(/\.0$/, '') + 'T';
    }
  }


  async toggleFollowUser() {
    if (this.authUserId == -1) {
      this.showErrorPopup.emit('Dear Anonymous Guest, you must be logged in to an account to do that');
      return;
    }

    const usernameToToggleFollow = this.username;
    const userIdToToggleFollow = this.userId;

    try {
        const response = await fetch('http://34.111.89.101/api/Home-Page/djangoBackend2/graphql', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
              query: `query toggleFollowUser($authUserId: Int!, $userIdToToggleFollow: Int!) {
                  toggleFollowUser(authUserId: $authUserId, userIdToToggleFollow: $userIdToToggleFollow)
              }`,
              variables: {
                authUserId: this.authUserId,
                userIdToToggleFollow: userIdToToggleFollow
              }
          }),
          credentials: 'include'
        });
        if(!response.ok) {
          this.showErrorPopup.emit(
            `The server had trouble toggling your follow-status of user ${usernameToToggleFollow}`
          );
        }
        else {
          let newFollowingStatus:any = await response.text();
          newFollowingStatus = newFollowingStatus.data.toggleFollowUser;

          if (newFollowingStatus==='Stranger') {
            this.updateFollowText.emit('Follow');
          }
          else if(newFollowingStatus==='Following') {
            this.updateFollowText.emit('Unfollow');
          }
          else {
            this.updateFollowText.emit('Cancel Request');
          }
        }
    }
    catch (error) {
      this.showErrorPopup.emit(`There was trouble connecting to the server to toggle your follow-status of
      user ${usernameToToggleFollow}`);
    }
  } 
}
