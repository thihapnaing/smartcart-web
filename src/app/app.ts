import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// Author: Htet Nandar (Grace)

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('smartcart-web-development');
}
