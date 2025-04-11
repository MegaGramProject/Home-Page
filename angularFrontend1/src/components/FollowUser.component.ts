import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';


@Component({
    selector: 'FollowUser',
    templateUrl: '../templates/FollowUser.component.html',
    imports: [CommonModule],
    standalone: true
})
export class FollowUser {
    @Input() authUserId!:number;
    @Input() userId!:number;

    @Input() username!:string;
    @Input() userFullName!:string;
    @Input() userPfp!:string;
    @Input() originalFollowText!:string;

    @Input() userIsVerified!:boolean;

    @Output() showErrorPopup:EventEmitter<string> = new EventEmitter<string>();

    followText:string = '';

    
    ngOnInit() {
        this.followText = this.originalFollowText;
    }


    async toggleFollowUser() {
        if (this.authUserId === -1) {
            this.showErrorPopup.emit(`You cannot toggle your follow-status of user ${this.username} when you are on 'Anonymous
            Guest' mode`);
            return;
        }

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
                        userIdToToggleFollow: this.userId
                    }
                }),
                credentials: 'include'
            });
            if(!response.ok) {
                this.showErrorPopup.emit(`The server had trouble toggling your follow-status of user ${this.username}`);
            }
            else {
                let newFollowingStatus = await response.json();
                newFollowingStatus = newFollowingStatus.data.toggleFollowUser;

                if(newFollowingStatus === 'Stranger') {
                    newFollowingStatus = 'Follow';
                }
                this.followText = newFollowingStatus;
            }
        }

        catch (error) {
            this.showErrorPopup.emit(`There was trouble connecting to the server to toggle your follow-status of user
            ${this.username}`);
        }
    }

}