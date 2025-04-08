import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
  selector: 'LeftSidebarPopup',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: '../templates/LeftSidebarPopup.component.html'
})
export class LeftSidebarPopup {
  @Input() authUserId!:number;
  @Input() originalURL!:string;

  @Output() showErrorPopup:EventEmitter<string> = new EventEmitter<string>();

  
  async logout() {
    try {
      const response = await fetch(`http://34.111.89.101/api/Home-Page/expressJSBackend1/logout/${this.authUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if(!response.ok) {
        this.showErrorPopup.emit('The expressJSBackend1 server had trouble logging you out');
      }
      else {
        window.location.href = this.originalURL;
      }
    }
    catch (error) {
      this.showErrorPopup.emit(
        'There was trouble connecting to the expressJSBackend1 server to log you out.'
      );
    }
  }
}
