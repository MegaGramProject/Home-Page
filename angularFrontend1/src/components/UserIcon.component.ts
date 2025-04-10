import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'UserIcon',
  templateUrl: '../templates/UserIcon.component.html',
  imports: [CommonModule],
  standalone: true
})
export class UserIcon {
    @Input() authUser!:string;
    @Input() username!:string;
    @Input() userPfp!:string|null;

    @Input() inStoriesSection!:boolean;
    @Input() userHasStories!:boolean;
    @Input() userHasUnseenStory!:boolean;
    @Input() userIsVerified!:boolean;
  
    @Output() showStoryViewer:EventEmitter<{username: string, isFromStoriesSection: boolean}> =
    new EventEmitter<{username: string, isFromStoriesSection: boolean}>();


    onClickingProfilePhoto() {
        if (this.userHasStories) {
            this.showStoryViewer.emit({username: this.username, isFromStoriesSection: this.inStoriesSection});
        }
        else {
            window.open(`http://34.111.89.101/profile/${this.username}`, '_blank');
        } 
    }
}