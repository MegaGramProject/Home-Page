import { Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
  selector: 'CommentsPopup',
  templateUrl: '../../templates/Popups/CommentsPopup.component.html',
  standalone: true
})
export class CommentsPopup {
    @Input() x!:string;
    
    @Output() y:EventEmitter<any> = new EventEmitter<any>();
}
