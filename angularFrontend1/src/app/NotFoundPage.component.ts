import { Component } from '@angular/core';


@Component({
  selector: 'NotFoundPage',
  standalone: true,
  templateUrl: './NotFoundPage.component.html'
})
export class NotFoundPage {


  ngOnInit(): void {
    document.title = "Page Not Found · 404";
  }
}
