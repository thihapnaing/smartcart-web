import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBar } from '../../shared/components/nav-bar/nav-bar';
import { ChatWidget } from '../../features/chat/components/chat-widget/chat-widget';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, NavBar, ChatWidget],
  templateUrl: './customer-layout.html'
})
export class CustomerLayout {}