import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
  selector: 'LeftSidebar',
  templateUrl: '../templates/LeftSidebar.component.html',
  imports: [
    CommonModule
  ],
  standalone: true
})
export class LeftSidebar {
  @Input() profilePhoto!:string;
  @Input() displayPopup!:boolean;
  @Input() authUserIsAnonymousGuest!:boolean;

  @Output() toggleDisplayLeftSidebarPopup:EventEmitter<any> = new EventEmitter<any>();
}
