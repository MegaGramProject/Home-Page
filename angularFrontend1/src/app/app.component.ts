import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class App {
  title:string = 'angularFrontend1';
}
