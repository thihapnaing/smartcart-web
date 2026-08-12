import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
// Author: Htet Nandar (Grace)

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('smartcart-web-development');

  protected readonly showChat = signal(true);

  protected readonly isAdminArea = signal(false);

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
