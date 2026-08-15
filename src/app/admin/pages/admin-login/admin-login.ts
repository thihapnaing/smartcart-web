import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth';
import { PublicStatsService } from '../../../services/public-stats';
import { PublicStats } from '../../../models/public-stats';

// AUTHOR: Htet Nandar(Grace)
/**
 * /admin/login - dark split-panel design matching the Figma admin reference. Calls the real
 * POST /api/auth/login via AdminAuthService; a successful login for a non-ADMIN account is
 * immediately logged back out client-side (see the role check in onSubmit()) rather than
 * landing in the admin UI shell just to have every subsequent API call rejected server-side.
 */
@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLogin implements OnInit {
  email = '';
  password = '';
  error = signal('');
  submitting = signal(false);

  stats = signal<PublicStats | null>(null);
  formattedRevenue = computed(() => {
    const s = this.stats();
    if (!s) return '—';
    return 'S$' + Math.round(s.totalRevenue).toLocaleString('en-SG');
  });

  constructor(
    private readonly adminAuth: AdminAuthService,
    private readonly publicStatsService: PublicStatsService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    // Live numbers for the left panel - this page renders before there's a JWT, so it hits
    // the unauthenticated /api/public/stats endpoint (PublicStatsService), not the ADMIN-gated
    // /api/admin/dashboard/stats the dashboard itself uses.
    this.publicStatsService.getStats().subscribe({
      next: (data) => this.stats.set(data),
      error: () => this.stats.set(null),
    });
  }

  onSubmit(): void {
    if (!this.email.trim() || !this.password.trim()) {
      this.error.set('Enter both email and password to continue.');
      return;
    }

    this.error.set('');
    this.submitting.set(true);

    this.adminAuth.login(this.email.trim(), this.password).subscribe({
      next: (response) => {
        this.submitting.set(false);

        if (response.role !== 'ADMIN') {
          // Login succeeded but this account isn't an admin - undo the session AdminAuthService
          // just stored and keep the user on the login page instead of the dashboard.
          this.adminAuth.logout();
          this.error.set('This account does not have admin access.');
          return;
        }

        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(typeof err?.error === 'string' ? err.error : 'Invalid email or password.');
      },
    });
  }
}
