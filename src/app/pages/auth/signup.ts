import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  fullName = '';
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
    console.log('SIGNUP BUTTON CLICKED');

    this.errorMessage = '';

    if (!this.fullName.trim()) {
      this.errorMessage = 'Please enter your full name.';
      return;
    }

    if (!this.email.trim()) {
      this.errorMessage = 'Please enter your email.';
      return;
    }

    if (!this.password) {
      this.errorMessage = 'Please enter your password.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.loading = true;

    /*
     * Your backend RegisterRequest currently requires:
     * username
     * email
     * password
     *
     * We use the full name as the username.
     */
    const request = {
      username: this.fullName.trim(),
      email: this.email.trim(),
      password: this.password,
    };

    console.log('Sending signup request:', request);

    this.authService.register(request).subscribe({
      next: (response) => {
        console.log('SIGNUP RESPONSE:', response);

        this.loading = false;

        /*
         * Backend register() already returns a LoginResponse
         * containing a JWT token.
         */
        if (response.token) {
          localStorage.setItem('token', response.token);

          localStorage.setItem('user', JSON.stringify(response));

          localStorage.setItem('username', response.username);

          localStorage.setItem('role', response.role);
        }

        console.log('Signup successful');

        this.router.navigate(['/']);
      },

      error: (error) => {
        console.error('Signup failed:', error);

        this.loading = false;

        if (error.error) {
          if (typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else if (error.error.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Signup failed. Please try again.';
          }
        } else {
          this.errorMessage = 'Signup failed. Please try again.';
        }
      },
    });
  }
}
