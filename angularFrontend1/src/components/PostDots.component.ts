import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';


@Component({
  selector: 'PostDots',
  templateUrl: '../templates/PostDots.component.html',
  imports: [CommonModule],
  standalone: true
})
export class PostDots {
  @Input() currSlide!:number;
  @Input() numSlides!:number


  createArray(numSlides:number) {
    return Array.from({ length: numSlides });
  }
}
