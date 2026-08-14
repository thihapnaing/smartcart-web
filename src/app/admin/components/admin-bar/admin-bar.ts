import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth';

// AUTHOR: Htet Nandar(Grace)
/**
 * Top bar for the admin area - deliberately not the customer NavBar (no Women/Men links,
 * search box, cart, or notifications, since none of that applies to an admin workflow).
 * Dark theme, styled after the Meridian admin reference design.
 */
@Component({
  selector: 'app-admin-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-bar.html',
  styleUrl: './admin-bar.css',
})
export class AdminBar {
  constructor(
    public readonly adminAuth: AdminAuthService,
    private readonly router: Router,
  ) {}

  signOut(): void {
    this.adminAuth.logout();
    this.router.navigate(['/admin/login']);
  }
}
