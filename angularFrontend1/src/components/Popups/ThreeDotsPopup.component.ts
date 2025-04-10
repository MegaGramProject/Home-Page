import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
  selector: 'ThreeDotsPopup',
  templateUrl: '../../templates/Popups/ThreeDotsPopup.component.html',
  imports: [CommonModule],
  standalone: true
})
export class ThreeDotsPopup {
    @Input() authUserId!:number;
    @Input() postDetails!:any;

    @Output() hidePost:EventEmitter<any> = new EventEmitter<any>();
    @Output() showAboutAccountPopup:EventEmitter<{ username: string; userId: number; }> = new
    EventEmitter<{ username: string; userId: number; }>();
    @Output() closePopup:EventEmitter<any> = new EventEmitter<any>();
    @Output() showErrorPopup:EventEmitter<string> = new EventEmitter<string>();

    copyLinkText:string = 'Copy link';
    toggleFollowText:string = 'Unfollow';


    copyPostLinkToClipboard() {
      navigator.clipboard.writeText(
        `http://34.111.89.101/posts/${this.postDetails.overallPostId}`
      )
      .then(() => {
          this.copyLinkText = 'Copied';
          setTimeout(() => {
            this.copyLinkText = 'Copy link';
          }, 550);
      })
      .catch(_ => {
          _;
          this.copyLinkText = 'Failed to copy'
          setTimeout(() => {
            this.copyLinkText = 'Copy link';
          }, 550);
      });
    }


    visitPostLink() {
      window.open(`http://34.111.89.101/posts/${this.postDetails.overallPostId}`, '_blank');
    }


    visitAdLink() {
      window.open(this.postDetails.adInfo.link, '_blank');
    }

    async toggleFollowUser() {
      if (this.authUserId == -1) {
        this.showErrorPopup.emit('Dear Anonymous Guest, you must be logged in to an account to do that');
        return;
      }

      const usernameToToggleFollow = this.postDetails.authors[0];
      const userIdToToggleFollow = this.postDetails.authorIds[0];

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
            this.showErrorPopup.emit(`The server had trouble toggling your follow-status of ${usernameToToggleFollow}`);
        }
        else {
          let newFollowingStatus:any = await response.text();
          newFollowingStatus = newFollowingStatus.data.toggleFollowUser;

          if (newFollowingStatus==='Stranger') {
            this.toggleFollowText = 'Follow';
          }
          else if(newFollowingStatus==='Following') {
            this.toggleFollowText = 'Unfollow';
          }
          else {
            this.toggleFollowText = 'Cancel Request';
          }
        }
      }
      catch {
        this.showErrorPopup.emit(`There was trouble connecting to the server to toggle your follow-status of
        ${usernameToToggleFollow}`);
      }
    }


  async markPostAsNotInterested() {
      if (this.authUserId == -1) {
        this.showErrorPopup.emit('Dear Anonymous Guest, you must be logged in to an account to do that');
        return;
      }

      //for sake of simplicity, the code for this method has been omitted
      this.closePopup.emit();
  }
}
