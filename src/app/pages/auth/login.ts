import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';

  showPassword = false;
  loading = false;
  error = '';

  login(): void {
    console.log('LOGIN BUTTON CLICKED');
    this.error = '';

    if (!this.email.trim()) {
      this.error = 'Please enter your email.';
      return;
    }

    if (!this.password) {
      this.error = 'Please enter your password.';
      return;
    }

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
        next: () => {
          this.loading = false;

          this.router.navigate(['/']);
        },

        error: (error) => {
          console.error('Login failed:', error);

          this.loading = false;

          if (error.status === 401) {
            this.error = 'Invalid email or password.';
          } else {
            this.error = 'Unable to login. Please try again.';
          }
        },
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
