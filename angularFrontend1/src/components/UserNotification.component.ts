import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
  selector: 'UserNotification',
  templateUrl: '../templates/UserNotification.component.html',
  imports: [CommonModule],
  standalone: true
})
export class UserNotification {
  @Input() leftImage!:any;
  @Input() rightImage!:any;

  @Input() description!:string;

  @Input() leftImageLink!:string;
  @Input() entireNotificationLink!:string;

  @Output() deleteThis:EventEmitter<any>= new EventEmitter<any>();

  userIsHoveringOnThisNotification = false;

  elementsForDescription:{ type: string, text?: string, href?: string }[] = [];

  timeoutIdForDeletingThis:any = null;


  ngOnInit() {
    this.finishSettingElementsForDescription();

    this.timeoutIdForDeletingThis = setTimeout(() => { this.deleteThis.emit(null); }, 4500);
  }


  ngOnDestroy() {
    clearTimeout(this.timeoutIdForDeletingThis);
  }


  finishSettingElementsForDescription() {
    const newElementsForDescription:{ type: string, text?: string, href?: string }[] = [
      { type: 'span', text: ' ' }
    ];

    let description = this.description;

    while (description.length > 0) {
      const indexOfNextAtSymbol = description.indexOf('@');
      const indexOfNextHashtag = description.indexOf('#');

      if (indexOfNextAtSymbol === -1 && indexOfNextHashtag === -1) {
        newElementsForDescription.push({ type: 'span', text: description });
        break;
      }
      else if (indexOfNextAtSymbol === -1 || (indexOfNextHashtag !== -1 && indexOfNextHashtag < indexOfNextAtSymbol)) {
        newElementsForDescription.push({
          type: 'span',
          text: description.substring(0, indexOfNextHashtag)
        });

        description = description.substring(indexOfNextHashtag);
        let indexOfSpaceAfterHashtagUsed = description.indexOf(' ');

        if (indexOfSpaceAfterHashtagUsed === -1)
          indexOfSpaceAfterHashtagUsed = description.length;

        const hashtagUsed = description.substring(0, indexOfSpaceAfterHashtagUsed);
        newElementsForDescription.push({
          type: 'a',
          text: hashtagUsed,
          href: `http://34.111.89.101/search/tags/${hashtagUsed.substring(1)}`
        });

        description = description.substring(indexOfSpaceAfterHashtagUsed);
      }
      else {
        newElementsForDescription.push({
          type: 'span',
          text: description.substring(0, indexOfNextAtSymbol)
        });

        description = description.substring(indexOfNextAtSymbol);
        let indexOfSpaceAfterMentionedUsername = description.indexOf(' ');

        if (indexOfSpaceAfterMentionedUsername === -1)
          indexOfSpaceAfterMentionedUsername = description.length;

        const mentionedUsername = description.substring(0, indexOfSpaceAfterMentionedUsername);
        newElementsForDescription.push({
          type: 'a',
          text: mentionedUsername,
          href: `http://34.111.89.101/profile/${mentionedUsername.substring(1)}`
        });

        description = description.substring(indexOfSpaceAfterMentionedUsername);
      }
    }

    this.elementsForDescription = newElementsForDescription;
  }


  handleMouseLeave() {
    setTimeout(() => this.userIsHoveringOnThisNotification = false, 600)
  }
}
