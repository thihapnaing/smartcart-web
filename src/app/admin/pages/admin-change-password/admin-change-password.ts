import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth';

// AUTHOR: Htet Nandar (Grace)
/** Forced first-login step for an admin account created via POST /api/admin/admins - it's
 * still on its one-time generated temporary password (see
 * AdminAccountService.generateTemporaryPassword() on the backend) until this form replaces it.
 * AdminLogin redirects here instead of the dashboard whenever the login response's
 * mustChangePassword flag is true. */
@Component({
  selector: 'app-admin-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-change-password.html',
  styleUrl: './admin-change-password.css',
})
export class AdminChangePassword {
  newPassword = '';
  confirmPassword = '';
  error = signal('');
  submitting = signal(false);

  constructor(
    private readonly adminAuth: AdminAuthService,
    private readonly router: Router,
  ) {}

  onSubmit(): void {
    if (!this.newPassword.trim() || !this.confirmPassword.trim()) {
      this.error.set('Enter and confirm your new password to continue.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.error.set('Password must be at least 6 characters.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.error.set('');
    this.submitting.set(true);

    this.adminAuth.changePassword(this.newPassword, this.confirmPassword).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(typeof err?.error === 'string' ? err.error : 'Could not change your password.');
      },
    });
  }
}
