import { AccountPreview } from './AccountPreview.component';

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
    selector: 'UserBar',
    templateUrl: '../templates/UserBar.component.html',
    imports: [CommonModule, AccountPreview],
    standalone: true
})
export class UserBar {
    @Input() username!:string;
    @Input() userFullName!:string;
    @Input() userPfp!:string;

    @Input() authUserId!:number;
    @Input() userId!:number;
    @Input() numFollowers!:number;
    @Input() numFollowings!:number;
    @Input() numPosts!:number;

    @Input() userIsPrivate!:boolean;
    @Input() userIsVerified!:boolean;

    @Output() showErrorPopup:EventEmitter<string> = new EventEmitter<string>();

    toggleFollowText:string = 'Follow';

    displayAccountPreview:boolean = false;


    takeUserToLogin() {
        window.open('http://34.111.89.101/login', '_blank');
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
                `The server had trouble toggling your follow-status of user ${usernameToToggleFollow}`);
            }
            else {
                let newFollowingStatus:any = await response.text();
                newFollowingStatus = newFollowingStatus.data.toggleFollowUser;

                if (newFollowingStatus==='Stranger') {
                    this.toggleFollowText = 'Follow'
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
            user ${usernameToToggleFollow}`);
        }
    }


    setDisplayAccountPreviewToTrue() {
        this.displayAccountPreview = true;
    }


    setDisplayAccountPreviewToFalse() {
        this.displayAccountPreview = false;
    }


    updateFollowTextFromAccountPreview(newToggleFollowText:string) {
        this.toggleFollowText = newToggleFollowText;
    }
}
