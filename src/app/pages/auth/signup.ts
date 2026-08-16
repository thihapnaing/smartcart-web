import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

//Author: Junior

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  // =========================================================
  // SIGNUP STEP
  // =========================================================

  signupStep: 'credentials' | 'profile' = 'credentials';

  // =========================================================
  // STEP 1 - ACCOUNT
  // =========================================================

  fullName = '';
  email = '';
  password = '';

  showPassword = false;

  // =========================================================
  // STEP 2 - PROFILE
  // =========================================================

  firstName = '';
  lastName = '';
  address = '';
  postalCode = '';
  phoneNumber = '';

  // =========================================================
  // AVATAR
  // =========================================================

  avatarFile: File | null = null;
  avatarPreview: string | null = null;

  // =========================================================
  // STATE
  // =========================================================

  loading = false;
  errorMessage = '';

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  // =========================================================
  // PASSWORD SHOW / HIDE
  // =========================================================

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // =========================================================
  // MAIN SIGNUP
  // =========================================================

  signup(): void {
    this.errorMessage = '';

    this.cdr.detectChanges();

    if (this.signupStep === 'credentials') {
      this.createAccount();

      return;
    }

    this.createProfile();
  }

  // =========================================================
  // STEP 1 - CREATE ACCOUNT
  // =========================================================

  private createAccount(): void {
    // =======================================================
    // USERNAME
    // =======================================================

    const username = this.fullName.trim();

    if (!username) {
      this.showError('Please enter your username.');

      return;
    }

    // =======================================================
    // EMAIL
    // =======================================================

    const email = this.email.trim();

    if (!email) {
      this.showError('Please enter your email.');

      return;
    }

    // =======================================================
    // EMAIL FORMAT
    // =======================================================

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      this.showError('Please enter a valid email address.');

      return;
    }

    // =======================================================
    // PASSWORD REQUIRED
    // =======================================================

    if (!this.password) {
      this.showError('Please enter your password.');

      return;
    }

    // =======================================================
    // PASSWORD - MINIMUM 6 CHARACTERS
    // =======================================================

    if (this.password.length < 6) {
      this.showError('Password must be at least 6 characters.');

      return;
    }

    // =======================================================
    // PASSWORD - UPPERCASE
    // =======================================================

    if (!/[A-Z]/.test(this.password)) {
      this.showError('Password must contain at least one uppercase letter.');

      return;
    }

    // =======================================================
    // PASSWORD - LOWERCASE
    // =======================================================

    if (!/[a-z]/.test(this.password)) {
      this.showError('Password must contain at least one lowercase letter.');

      return;
    }

    // =======================================================
    // PASSWORD - NUMBER
    // =======================================================

    if (!/[0-9]/.test(this.password)) {
      this.showError('Password must contain at least one number.');

      return;
    }

    // =======================================================
    // START LOADING
    // =======================================================

    this.loading = true;
    this.errorMessage = '';

    this.cdr.detectChanges();

    // =======================================================
    // REGISTER REQUEST
    // =======================================================

    const request = {
      username: username,

      email: email,

      password: this.password,
    };

    console.log('Sending signup request:', {
      username,
      email,
    });

    this.authService.register(request).subscribe({
      // ===================================================
      // SUCCESS
      // ===================================================

      next: (response) => {
        console.log('SIGNUP SUCCESS:', response);

        this.loading = false;

        // =================================================
        // CHECK USER ID
        // =================================================

        if (!response?.userId) {
          this.showError('Account was created, but user information was not returned.');

          return;
        }

        // =================================================
        // CHECK TOKEN
        // =================================================

        if (!response?.token) {
          this.showError('Account was created, but authentication token was not returned.');

          return;
        }

        // =================================================
        // SAVE USER ID
        // =================================================

        localStorage.setItem('pendingSignupUserId', response.userId.toString());

        // =================================================
        // SAVE JWT
        // =================================================

        localStorage.setItem('token', response.token);

        // =================================================
        // SAVE USER INFORMATION
        // =================================================

        if (response.username) {
          localStorage.setItem('username', response.username);
        }

        if (response.email) {
          localStorage.setItem('email', response.email);
        }

        if (response.role) {
          localStorage.setItem('role', response.role);
        }

        console.log('JWT saved for profile creation');

        console.log('Pending user ID:', response.userId);

        // =================================================
        // MOVE TO PROFILE STEP
        // =================================================

        this.signupStep = 'profile';

        this.errorMessage = '';

        this.cdr.detectChanges();
      },

      // ===================================================
      // ERROR
      // ===================================================

      error: (error) => {
        console.error('SIGNUP FAILED:', error);

        this.loading = false;

        const message = this.extractErrorMessage(error);

        console.log('ERROR MESSAGE TO DISPLAY:', message);

        if (message) {
          this.errorMessage = message;

          this.cdr.detectChanges();

          return;
        }

        // =================================================
        // 400
        // =================================================

        if (error?.status === 400) {
          this.showError(
            'The username or email is already registered, or the information is invalid.',
          );

          return;
        }

        // =================================================
        // 409
        // =================================================

        if (error?.status === 409) {
          this.showError('The username or email is already registered.');

          return;
        }

        // =================================================
        // DEFAULT
        // =================================================

        this.showError('Unable to create account. Please try again.');
      },
    });
  }

  // =========================================================
  // STEP 2 - CREATE PROFILE
  // =========================================================

  private createProfile(): void {
    this.errorMessage = '';

    this.cdr.detectChanges();

    // =======================================================
    // GET USER ID
    // =======================================================

    const userIdString = localStorage.getItem('pendingSignupUserId');

    if (!userIdString) {
      this.showError('Your signup session has expired. Please start again.');

      this.signupStep = 'credentials';

      return;
    }

    const userId = Number(userIdString);

    if (!Number.isFinite(userId) || userId <= 0) {
      this.showError('Invalid user information. Please start again.');

      this.signupStep = 'credentials';

      return;
    }

    // =======================================================
    // FIRST NAME
    // =======================================================

    if (!this.firstName.trim()) {
      this.showError('Please enter your first name.');

      return;
    }

    // =======================================================
    // LAST NAME
    // =======================================================

    if (!this.lastName.trim()) {
      this.showError('Please enter your last name.');

      return;
    }

    // =======================================================
    // ADDRESS
    // =======================================================

    if (!this.address.trim()) {
      this.showError('Please enter your address.');

      return;
    }

    // =======================================================
    // POSTAL CODE
    // =======================================================

    if (!this.postalCode.trim()) {
      this.showError('Please enter your postal code.');

      return;
    }

    // =======================================================
    // PHONE NUMBER
    // =======================================================

    if (!this.phoneNumber.trim()) {
      this.showError('Please enter your phone number.');

      return;
    }

    // =======================================================
    // CHECK TOKEN
    // =======================================================

    const token = localStorage.getItem('token');

    if (!token) {
      this.showError('Authentication session is missing. Please start signup again.');

      this.signupStep = 'credentials';

      return;
    }

    // =======================================================
    // START LOADING
    // =======================================================

    this.loading = true;
    this.errorMessage = '';

    this.cdr.detectChanges();

    console.log('Creating user profile');

    console.log({
      userId,
      firstName: this.firstName,
      lastName: this.lastName,
      address: this.address,
      postalCode: this.postalCode,
      phoneNumber: this.phoneNumber,
      avatarFile: this.avatarFile,
    });

    // =======================================================
    // CREATE PROFILE + UPLOAD AVATAR
    // =======================================================

    this.authService
      .createUserProfileWithAvatar(
        userId,

        this.firstName.trim(),

        this.lastName.trim(),

        this.address.trim(),

        this.postalCode.trim(),

        this.phoneNumber.trim(),

        this.avatarFile,
      )
      .subscribe({
        // ===================================================
        // SUCCESS
        // ===================================================

        next: (response) => {
          console.log('PROFILE CREATED:', response);

          this.loading = false;

          // =================================================
          // REMOVE TEMPORARY USER ID
          // =================================================

          localStorage.removeItem('pendingSignupUserId');

          console.log('SIGNUP COMPLETED');

          // =================================================
          // GO TO LOGIN
          // =================================================

          this.router.navigate(['/login']);
        },

        // ===================================================
        // ERROR
        // ===================================================

        error: (error) => {
          console.error('PROFILE CREATION FAILED:', error);

          this.loading = false;

          const message = this.extractErrorMessage(error);

          if (message) {
            this.showError(message);

            return;
          }

          // =================================================
          // 403
          // =================================================

          if (error?.status === 403) {
            this.showError('You are not authorized to create this profile. Please sign up again.');

            return;
          }

          // =================================================
          // 413
          // =================================================

          if (error?.status === 413) {
            this.showError('The avatar image is too large. Maximum size is 2 MB.');

            return;
          }

          // =================================================
          // DEFAULT
          // =================================================

          this.showError('Unable to save your profile. Please try again.');
        },
      });
  }

  // =========================================================
  // AVATAR SELECTED
  // =========================================================

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) {
      return;
    }

    // =======================================================
    // CHECK IMAGE TYPE
    // =======================================================

    if (!file.type.startsWith('image/')) {
      this.showError('Please select a valid image file.');

      input.value = '';

      return;
    }

    // =======================================================
    // AVATAR SIZE - MAXIMUM 2 MB
    // =======================================================

    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      this.showError('Avatar image must be smaller than 2 MB.');

      // -----------------------------------------------------
      // Clear selected file
      // -----------------------------------------------------

      input.value = '';

      // -----------------------------------------------------
      // Clear avatar
      // -----------------------------------------------------

      this.avatarFile = null;

      this.avatarPreview = null;

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // SAVE FILE
    // =======================================================

    this.avatarFile = file;

    this.errorMessage = '';

    this.cdr.detectChanges();

    console.log('Avatar selected:', file.name);

    console.log('Avatar size:', `${(file.size / 1024).toFixed(1)} KB`);

    // =======================================================
    // CREATE PREVIEW
    // =======================================================

    const reader = new FileReader();

    reader.onload = () => {
      this.avatarPreview = reader.result as string;

      this.cdr.detectChanges();
    };

    reader.onerror = () => {
      this.avatarFile = null;

      this.avatarPreview = null;

      this.showError('Could not read the selected image.');
    };

    reader.readAsDataURL(file);
  }

  // =========================================================
  // BACK TO STEP 1
  // =========================================================

  backToCredentials(): void {
    this.signupStep = 'credentials';

    this.errorMessage = '';

    this.cdr.detectChanges();
  }

  // =========================================================
  // SHOW ERROR
  // =========================================================

  private showError(message: string): void {
    this.errorMessage = message;

    this.loading = false;

    this.cdr.detectChanges();

    console.log('ANGULAR ERROR MESSAGE:', this.errorMessage);
  }

  // =========================================================
  // EXTRACT BACKEND ERROR
  // =========================================================

  private extractErrorMessage(error: any): string {
    // =======================================================
    // PLAIN TEXT
    // =======================================================

    if (typeof error?.error === 'string') {
      return error.error.trim();
    }

    // =======================================================
    // { message: "..." }
    // =======================================================

    if (error?.error?.message) {
      return String(error.error.message).trim();
    }

    // =======================================================
    // { error: "..." }
    // =======================================================

    if (error?.error?.error) {
      return String(error.error.error).trim();
    }

    // =======================================================
    // { detail: "..." }
    // =======================================================

    if (error?.error?.detail) {
      return String(error.error.detail).trim();
    }

    return '';
  }
}
