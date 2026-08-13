import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth';
import { AdminDashboardService } from '../../services/admin-dashboard';
import { AdminDashboardStats } from '../../models/admin-dashboard-stats';

// AUTHOR: Htet Nandar(Grace)
/**
 * /admin/login - dark split-panel design matching the Figma admin reference. There's no real
 * backend auth yet (see AdminAuthService), so this just checks both fields are non-empty and
 * flips the session flag - it's a UI gate, not a security boundary.
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

  stats = signal<AdminDashboardStats | null>(null);
  formattedRevenue = computed(() => {
    const s = this.stats();
    if (!s) return '—';
    return 'S$' + Math.round(s.totalRevenue).toLocaleString('en-SG');
  });

  constructor(
    private readonly adminAuth: AdminAuthService,
    private readonly adminDashboardService: AdminDashboardService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    // Live numbers for the left panel - real data from the same stats endpoint the
    // dashboard uses, not placeholder marketing figures.
    this.adminDashboardService.getStats().subscribe({
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
    this.adminAuth.login();
    this.router.navigate(['/admin/dashboard']);
  }
}
