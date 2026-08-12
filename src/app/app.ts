import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
// Author: Htet Nandar (Grace)
import { NavBar } from './shared/components/nav-bar/nav-bar';
import { ChatWidget } from './features/chat/components/chat-widget/chat-widget';
import { AdminBar } from './admin/components/admin-bar/admin-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBar, AdminBar, ChatWidget],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('smartcart-web-development');

  // The AI shopping assistant is a customer-facing feature - hidden on admin/merchant
  // routes (tagged via that route's `data.hideChat`) rather than gated by role, since
  // there's no real auth yet to tell customer/merchant/admin apart on the client.
  protected readonly showChat = signal(true);

  // Same idea for the top bar: admin routes (`data.isAdminArea`) get AdminBar instead of
  // the customer NavBar - no Women/Men/search/cart/notifications, since none of that
  // belongs in an admin workflow.
  protected readonly isAdminArea = signal(false);

  // The admin login page (`data.hideNav`) is a full-bleed split panel per the Figma
  // reference - no top bar at all, admin or customer.
  protected readonly hideNav = signal(false);

  constructor(private readonly router: Router, private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.updateRouteFlags();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.updateRouteFlags());
  }

  private updateRouteFlags(): void {
    let deepest = this.route.root;
    while (deepest.firstChild) {
      deepest = deepest.firstChild;
    }
    const data = deepest.snapshot.data;
    this.showChat.set(!data['hideChat']);
    this.isAdminArea.set(!!data['isAdminArea']);
    this.hideNav.set(!!data['hideNav']);
  }
}
