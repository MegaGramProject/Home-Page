import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'SelectUserOrGroupChat',
  templateUrl: '../templates/SelectUserOrGroupChat.component.html',
  imports: [CommonModule],
  standalone: true
})
export class SelectUserOrGroupChat {
  @Input() groupChatId!:number;

  @Input() usernameOrGroupChatName!:string;
  @Input() fullName!:string;
  @Input() profilePhoto!:string;

  @Input() isSelected!:boolean;
  @Input() isVerified!:boolean;

  @Output() selectThisUserOrGroupChat:EventEmitter<string> = new EventEmitter<string>();
  @Output() unselectThisUserOrGroupChat:EventEmitter<string> = new EventEmitter<string>();


  toggleSelectThisUserOrGroupChat() {
    if(!this.isSelected) {
      if(this.groupChatId==null) {
        this.selectThisUserOrGroupChat.emit(this.usernameOrGroupChatName);
      }
      else {
        this.selectThisUserOrGroupChat.emit('GROUP CHAT ' + this.groupChatId);
      }
    }
    else {
      if(this.groupChatId==null) {
        this.unselectThisUserOrGroupChat.emit(this.usernameOrGroupChatName);
      }
      else {
        this.unselectThisUserOrGroupChat.emit('GROUP CHAT ' + this.groupChatId);
      }
    }
  }
}