import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// Author: Htet Nandar (Grace)
import { NavBar } from './shared/components/nav-bar/nav-bar';
import { ChatWidget } from './features/chat/components/chat-widget/chat-widget';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBar, ChatWidget],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('smartcart-web-development');
}
