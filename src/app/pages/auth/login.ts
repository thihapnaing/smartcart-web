import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

//Author: Junior

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';

  showPassword = false;
  loading = false;
  error = '';

  login(): void {
    console.log('LOGIN BUTTON CLICKED');

    this.error = '';

    // VALIDATE EMAIL
    if (!this.email.trim()) {
      this.error = 'Please enter your email.';

      return;
    }

    // VALIDATE PASSWORD
    if (!this.password) {
      this.error = 'Please enter your password.';

      return;
    }

    // START LOGIN
    this.loading = true;

    console.log('Sending login request:', {
      email: this.email,
    });

    this.authService
      .login({
        email: this.email.trim(),
        password: this.password,
      })
      .subscribe({
        // LOGIN SUCCESS
        next: (response) => {
          this.loading = false;

          console.log('Login response:', response);

          console.log('User role:', response.role);

          // CUSTOMER
          if (response.role === 'CUSTOMER') {
            console.log('Customer login → Home');

            this.router.navigate(['/']);
          }

          // MERCHANT
          else if (response.role === 'MERCHANT') {
            console.log('Merchant login → Merchant Dashboard');

            this.router.navigate(['/merchant']);
          }

          // UNKNOWN ROLE
          else {
            console.error('Unknown user role:', response.role);

            this.error = 'Invalid user role.';
          }
        },

        // LOGIN ERROR
        error: (error) => {
          console.error('LOGIN FAILED:', error);

          this.loading = false;

          if (error.status === 401) {
            this.error = 'Invalid email or password.';
          } else {
            this.error = error?.error?.message || 'Unable to login. Please try again.';
          }

          console.log('LOGIN ERROR TO DISPLAY:', this.error);

          // Force Angular to update the page
          this.cdr.detectChanges();
        },
      });
  }

  // TOGGLE PASSWORD SHOW
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
