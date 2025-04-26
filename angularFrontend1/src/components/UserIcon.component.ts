import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';


@Component({
    selector: 'UserIcon',
    templateUrl: '../templates/UserIcon.component.html',
    imports: [CommonModule],
    standalone: true
})
export class UserIcon {
    @Input() authUserId!:number;

    @Input() userId!:number;
    @Input() username!:string;
    @Input() userPfp!:string|null;

    @Input() inStoriesSection!:boolean;
    @Input() userHasStories!:boolean;
    @Input() userHasUnseenStory!:boolean;
    @Input() userIsVerified!:boolean;
  
    @Output() showStoryViewer:EventEmitter<{ newStoryViewerMainUserId: number, newStoryViewerMainUsername: string,
    newStoryViewerIsFromStoriesSection:boolean }> =
    new EventEmitter<{
        newStoryViewerMainUserId: number,
        newStoryViewerMainUsername: string,
        newStoryViewerIsFromStoriesSection:boolean
    }>();


    onClickingProfilePhoto() {
        if (this.userHasStories) {
            this.showStoryViewer.emit({ newStoryViewerMainUserId: this.userId, newStoryViewerMainUsername: this.username,
            newStoryViewerIsFromStoriesSection: this.inStoriesSection });
        }
        else {
            window.open(`http://34.111.89.101/profile/${this.username}`, '_blank');
        } 
    }
}