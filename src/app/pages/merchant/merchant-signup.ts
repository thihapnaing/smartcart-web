import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-merchant-signup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './merchant-signup.html',
  styleUrl: './merchant-signup.css',
})
export class MerchantSignup {
  username = '';
  email = '';
  password = '';

  showPassword = false;

  loading = false;
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  signup(): void {
    this.errorMessage = '';

    // Validate username
    if (!this.username.trim()) {
      this.errorMessage = 'Please enter your username.';
      return;
    }

    // Validate email
    if (!this.email.trim()) {
      this.errorMessage = 'Please enter your email.';
      return;
    }

    // Validate password
    if (!this.password) {
      this.errorMessage = 'Please enter your password.';
      return;
    }

    // Validate password length
    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.loading = true;

    console.log('MERCHANT SIGNUP');

    console.log({
      username: this.username,
      email: this.email,
    });

    // Register merchant
    this.authService
      .registerMerchant({
        username: this.username.trim(),
        email: this.email.trim(),
        password: this.password,
      })
      .subscribe({
        // =========================
        // SUCCESS
        // =========================

        next: (response) => {
          console.log('Merchant signup successful:', response);

          this.loading = false;

          // Go to login page
          this.router.navigate(['/login']);
        },

        // =========================
        // ERROR
        // =========================

        error: (error) => {
          console.error('Merchant signup failed:', error);

          this.loading = false;

          if (error.status === 400) {
            this.errorMessage = error.error || 'Unable to create merchant account.';
          } else {
            this.errorMessage = 'Unable to create merchant account. Please try again.';
          }
        },
      });
  }
}
