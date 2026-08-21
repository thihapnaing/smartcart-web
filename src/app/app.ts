import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IdleTimeoutService } from './services/idle-timeout.service'; //Junior

// Author: Htet Nandar (Grace)
// Updated: Junior

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('smartcart-web-development');
  private readonly idleTimeoutService = inject(IdleTimeoutService);

  constructor() {
    this.idleTimeoutService.start();
  }
}
