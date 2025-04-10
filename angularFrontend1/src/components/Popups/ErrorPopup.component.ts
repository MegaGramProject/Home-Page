import { Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
  selector: 'ErrorPopup',
  templateUrl: '../../templates/Popups/ErrorPopup.component.html',
  standalone: true
})
export class ErrorPopup {
    @Input() errorMessage!:string;
    
    @Output() closePopup:EventEmitter<any> = new EventEmitter<any>();
}
