import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

//Author: Junior

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // =========================================================
  // FORM FIELDS
  // =========================================================

  email = '';

  newPassword = '';

  confirmPassword = '';

  // =========================================================
  // PASSWORD VISIBILITY
  // =========================================================

  showNewPassword = false;

  showConfirmPassword = false;

  // =========================================================
  // UI STATE
  // =========================================================

  loading = false;

  error = '';

  success = '';

  emailVerified = false;

  // =========================================================
  // CHECK EMAIL
  // =========================================================

  checkEmail(): void {
    console.log('CHECK EMAIL BUTTON CLICKED');

    this.error = '';

    this.success = '';

    const email = this.email.trim();

    // ---------------------------------------------------------
    // EMPTY EMAIL
    // ---------------------------------------------------------

    if (!email) {
      this.error = 'Please enter your email.';
      return;
    }

    // ---------------------------------------------------------
    // EMAIL FORMAT
    // ---------------------------------------------------------

    const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    if (!emailPattern.test(email)) {
      this.error = 'Please enter a valid email address.';
      return;
    }

    // ---------------------------------------------------------
    // START REQUEST
    // ---------------------------------------------------------

    this.loading = true;

    console.log('Checking email:', email);

    this.authService.checkEmail(email).subscribe({
      // =======================================================
      // SUCCESS
      // =======================================================

      next: (response) => {
        console.log('CHECK EMAIL RESPONSE:', response);

        // Email exists in database
        this.emailVerified = true;

        // Stop loading
        this.loading = false;

        // Clear previous error
        this.error = '';

        console.log('EMAIL VERIFIED:', this.emailVerified);
        console.log('LOADING:', this.loading);

        // Force UI update
        this.cdr.detectChanges();
      },

      // =======================================================
      // ERROR
      // =======================================================

      error: (error) => {
        console.error('CHECK EMAIL FAILED:', error);

        this.emailVerified = false;

        this.loading = false;

        this.error = error?.error?.message || error?.error || 'Email address not found.';

        console.log('ERROR TO DISPLAY:', this.error);
        console.log('LOADING:', this.loading);

        // Force UI update
        this.cdr.detectChanges();
      },

      // =======================================================
      // COMPLETE
      // =======================================================

      complete: () => {
        console.log('CHECK EMAIL REQUEST COMPLETED');

        this.loading = false;

        this.cdr.detectChanges();
      },
    });
  }

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  resetPassword(): void {
    console.log('RESET PASSWORD BUTTON CLICKED');

    this.error = '';

    this.success = '';

    // ---------------------------------------------------------
    // EMAIL MUST BE VERIFIED
    // ---------------------------------------------------------

    if (!this.emailVerified) {
      this.error = 'Please check your email address first.';
      return;
    }

    // ---------------------------------------------------------
    // EMPTY PASSWORD
    // ---------------------------------------------------------

    if (!this.newPassword) {
      this.error = 'Please enter your new password.';
      return;
    }

    // ---------------------------------------------------------
    // PASSWORD LENGTH
    // ---------------------------------------------------------

    if (this.newPassword.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }

    // ---------------------------------------------------------
    // UPPERCASE
    // ---------------------------------------------------------

    if (!/[A-Z]/.test(this.newPassword)) {
      this.error = 'Password must contain at least one uppercase letter.';
      return;
    }

    // ---------------------------------------------------------
    // LOWERCASE
    // ---------------------------------------------------------

    if (!/[a-z]/.test(this.newPassword)) {
      this.error = 'Password must contain at least one lowercase letter.';
      return;
    }

    // ---------------------------------------------------------
    // NUMBER
    // ---------------------------------------------------------

    if (!/\d/.test(this.newPassword)) {
      this.error = 'Password must contain at least one number.';
      return;
    }

    // ---------------------------------------------------------
    // CONFIRM PASSWORD
    // ---------------------------------------------------------

    if (!this.confirmPassword) {
      this.error = 'Please confirm your password.';
      return;
    }

    // ---------------------------------------------------------
    // PASSWORD MATCH
    // ---------------------------------------------------------

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    // ---------------------------------------------------------
    // START RESET
    // ---------------------------------------------------------

    this.loading = true;

    console.log('Resetting password for:', this.email);

    this.authService
      .resetPassword({
        email: this.email.trim(),
        newPassword: this.newPassword,
        confirmPassword: this.confirmPassword,
      })
      .subscribe({
        // =====================================================
        // SUCCESS
        // =====================================================

        next: (response) => {
          console.log('RESET PASSWORD RESPONSE:', response);

          this.loading = false;

          this.success = 'Password updated successfully.';

          this.error = '';

          this.newPassword = '';

          this.confirmPassword = '';

          this.cdr.detectChanges();

          // Go back to login after 1.5 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        },

        // =====================================================
        // ERROR
        // =====================================================

        error: (error) => {
          console.error('RESET PASSWORD FAILED:', error);

          this.loading = false;

          this.error = error?.error?.message || error?.error || 'Unable to reset password.';

          this.cdr.detectChanges();
        },
      });
  }

  // =========================================================
  // SHOW / HIDE NEW PASSWORD
  // =========================================================

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  // =========================================================
  // SHOW / HIDE CONFIRM PASSWORD
  // =========================================================

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // =========================================================
  // BACK TO LOGIN
  // =========================================================

  backToLogin(): void {
    this.router.navigate(['/login']);
  }
}
