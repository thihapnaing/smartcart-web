import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-merchant-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './merchant-signup.html',
  styleUrl: './merchant-signup.css',
})
export class MerchantSignup {
  // =========================================================
  // STEP
  // =========================================================

  signupStep = 1;

  // =========================================================
  // STEP 1
  // =========================================================

  username = '';

  email = '';

  password = '';

  showPassword = false;

  // =========================================================
  // STEP 2
  // =========================================================

  businessName = '';

  uen = '';

  businessType = '';

  businessAddress = '';

  postalCode = '';

  contactNumber = '';

  productCategory = '';

  businessDescription = '';

  pickupAvailable = false;

  // =========================================================
  // FILES
  // =========================================================

  logoFile: File | null = null;

  logoPreview: string | null = null;

  businessDocument: File | null = null;

  // =========================================================
  // UI
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
  // PASSWORD
  // =========================================================

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // =========================================================
  // SIGNUP ENTRY POINT
  // =========================================================

  signup(): void {
    this.errorMessage = '';

    this.cdr.detectChanges();

    // STEP 1
    if (this.signupStep === 1) {
      this.registerMerchantAccount();

      return;
    }

    // STEP 2
    this.submitMerchantApplication();
  }

  // =========================================================
  // STEP 1 VALIDATION + REGISTRATION
  // =========================================================

  private registerMerchantAccount(): void {
    const username = this.username.trim();

    const email = this.email.trim();

    // =======================================================
    // USERNAME
    // =======================================================

    if (!username) {
      this.errorMessage = 'Please enter your username.';

      this.cdr.detectChanges();

      return;
    }

    if (username.length < 3) {
      this.errorMessage = 'Username must be at least 3 characters.';

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // EMAIL
    // =======================================================

    if (!email) {
      this.errorMessage = 'Please enter your email.';

      this.cdr.detectChanges();

      return;
    }

    const atIndex = email.indexOf('@');
    const dotIndex = email.lastIndexOf('.');
    const hasSpace = email.includes(' ');

    const validEmail =
      atIndex > 0 &&
      dotIndex > atIndex + 1 &&
      dotIndex < email.length - 1 &&
      !hasSpace;

    if (!validEmail) {
      this.errorMessage = 'Please enter a valid email address.';

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // PASSWORD
    // =======================================================

    if (!this.password) {
      this.errorMessage = 'Please enter your password.';

      this.cdr.detectChanges();

      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';

      this.cdr.detectChanges();

      return;
    }

    if (!/[A-Z]/.test(this.password)) {
      this.errorMessage = 'Password must contain at least one uppercase letter.';

      this.cdr.detectChanges();

      return;
    }

    if (!/[a-z]/.test(this.password)) {
      this.errorMessage = 'Password must contain at least one lowercase letter.';

      this.cdr.detectChanges();

      return;
    }

    if (!/\d/.test(this.password)) {
      this.errorMessage = 'Password must contain at least one number.';

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // START REQUEST
    // =======================================================

    this.loading = true;

    this.errorMessage = '';

    const request = {
      username,

      email,

      password: this.password,
    };

    console.log('MERCHANT STEP 1 REGISTRATION:', {
      username,
      email,
    });

    // =======================================================
    // CALL BACKEND
    // =======================================================

    this.authService.registerMerchant(request).subscribe({
      // ===================================================
      // SUCCESS
      // ===================================================

      next: (response: any) => {
        console.log('MERCHANT REGISTRATION RESPONSE:', response);

        this.loading = false;

        // =================================================
        // USER ID
        // =================================================

        const userId = response?.userId ?? response?.id;

        if (!userId) {
          this.errorMessage = 'Account was created, but the user ID was not returned.';

          this.cdr.detectChanges();

          return;
        }

        // =================================================
        // SAVE USER ID FOR STEP 2
        // =================================================

        localStorage.setItem('pendingMerchantUserId', String(userId));

        // =================================================
        // SAVE TOKEN
        // =================================================

        if (response?.token) {
          localStorage.setItem('token', response.token);
        }

        // =================================================
        // SAVE USERNAME
        // =================================================

        localStorage.setItem('username', response?.username ?? username);

        // =================================================
        // SAVE EMAIL
        // =================================================

        localStorage.setItem('email', response?.email ?? email);

        // =================================================
        // SAVE ROLE
        // =================================================

        if (response?.role) {
          localStorage.setItem('role', response.role);
        }

        // =================================================
        // GO TO STEP 2
        // =================================================

        this.signupStep = 2;

        this.errorMessage = '';

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });

        this.cdr.detectChanges();
      },

      // ===================================================
      // ERROR
      // ===================================================

      error: (error: any) => {
        console.error('MERCHANT REGISTRATION FAILED:', error);

        this.loading = false;

        const message =
          this.extractErrorMessage(error) || 'Unable to create merchant account. Please try again.';

        this.errorMessage = message;

        console.log('ERROR MESSAGE TO DISPLAY:', this.errorMessage);

        this.cdr.detectChanges();
      },
    });
  }

  // =========================================================
  // LOGO
  // =========================================================

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) {
      return;
    }

    // =======================================================
    // IMAGE ONLY
    // =======================================================

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image for your business logo.';

      input.value = '';

      this.logoFile = null;

      this.logoPreview = null;

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // MAXIMUM 2 MB
    // =======================================================

    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      this.errorMessage = 'Business logo must be smaller than 2 MB.';

      input.value = '';

      this.logoFile = null;

      this.logoPreview = null;

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // GET ORIGINAL EXTENSION
    // =======================================================

    let extension = '';

    if (file.name.includes('.')) {
      extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    }

    // =======================================================
    // FALLBACK EXTENSION
    // =======================================================

    if (!extension) {
      if (file.type === 'image/jpeg') {
        extension = '.jpg';
      } else if (file.type === 'image/png') {
        extension = '.png';
      } else if (file.type === 'image/webp') {
        extension = '.webp';
      }
    }

    // =======================================================
    // CREATE SAFE FILE NAME
    // =======================================================

    const safeFileName = `merchant-logo-${Date.now()}${extension}`;

    // =======================================================
    // CREATE NEW FILE
    // =======================================================

    this.logoFile = new File([file], safeFileName, {
      type: file.type,
      lastModified: file.lastModified,
    });

    console.log('Original logo filename:', file.name);

    console.log('Safe logo filename:', this.logoFile.name);

    console.log('Logo size:', this.logoFile.size);

    console.log('Logo type:', this.logoFile.type);

    // =======================================================
    // CLEAR ERROR
    // =======================================================

    this.errorMessage = '';

    this.cdr.detectChanges();

    // =======================================================
    // PREVIEW
    // =======================================================

    const reader = new FileReader();

    reader.onload = () => {
      this.logoPreview = reader.result as string;

      this.cdr.detectChanges();
    };

    reader.onerror = () => {
      this.logoFile = null;

      this.logoPreview = null;

      this.errorMessage = 'Could not read the selected image.';

      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  // =========================================================
  // BUSINESS DOCUMENT
  // =========================================================

  onDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) {
      return;
    }

    // =======================================================
    // ALLOWED TYPES
    // =======================================================

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Please upload a PDF, JPG or PNG document.';

      input.value = '';

      this.businessDocument = null;

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // MAXIMUM 5 MB
    // =======================================================

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      this.errorMessage = 'Business registration document must be smaller than 5 MB.';

      input.value = '';

      this.businessDocument = null;

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // GET FILE EXTENSION
    // =======================================================

    let extension = '';

    if (file.name.includes('.')) {
      extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    }

    // =======================================================
    // FALLBACK EXTENSION
    // =======================================================

    if (!extension) {
      if (file.type === 'application/pdf') {
        extension = '.pdf';
      } else if (file.type === 'image/jpeg') {
        extension = '.jpg';
      } else if (file.type === 'image/png') {
        extension = '.png';
      }
    }

    // =======================================================
    // CREATE SAFE FILE NAME
    // =======================================================

    const safeFileName = `merchant-document-${Date.now()}${extension}`;

    // =======================================================
    // CREATE NEW FILE
    // =======================================================

    this.businessDocument = new File([file], safeFileName, {
      type: file.type,
      lastModified: file.lastModified,
    });

    console.log('Original document filename:', file.name);

    console.log('Safe document filename:', this.businessDocument.name);

    console.log('Document size:', this.businessDocument.size);

    console.log('Document type:', this.businessDocument.type);

    // =======================================================
    // CLEAR ERROR
    // =======================================================

    this.errorMessage = '';

    this.cdr.detectChanges();
  }

  // =========================================================
  // STEP 2 SUBMISSION
  // =========================================================

  private submitMerchantApplication(): void {
    this.errorMessage = '';

    // =======================================================
    // BUSINESS NAME
    // =======================================================

    if (!this.businessName.trim()) {
      this.errorMessage = 'Please enter your business or shop name.';

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // UEN
    // =======================================================

    if (!this.uen.trim()) {
      this.errorMessage = 'Please enter your UEN or business registration number.';

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // BUSINESS TYPE
    // =======================================================

    if (!this.businessType) {
      this.errorMessage = 'Please select your business type.';

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // ADDRESS
    // =======================================================

    if (!this.businessAddress.trim()) {
      this.errorMessage = 'Please enter your business address.';

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // POSTAL CODE
    // =======================================================

    if (!this.postalCode.trim()) {
      this.errorMessage = 'Please enter your postal code.';

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // PHONE
    // =======================================================

    if (!this.contactNumber.trim()) {
      this.errorMessage = 'Please enter your contact number.';

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // CATEGORY
    // =======================================================

    if (!this.productCategory) {
      this.errorMessage = 'Please select your product category.';

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // DESCRIPTION
    // =======================================================

    if (!this.businessDescription.trim()) {
      this.errorMessage = 'Please enter a description of your business.';

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // DOCUMENT
    // =======================================================

    if (!this.businessDocument) {
      this.errorMessage = 'Please upload your business registration document.';

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // USER ID
    // =======================================================

    const userId = Number(localStorage.getItem('pendingMerchantUserId'));

    if (!userId || !Number.isFinite(userId)) {
      this.errorMessage = 'Your registration session has expired. Please start again.';

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // START LOADING
    // =======================================================

    this.loading = true;

    this.errorMessage = '';

    // =======================================================
    // CREATE MERCHANT PROFILE
    // =======================================================

    this.authService
      .createMerchantProfile({
        userId,
        businessName: this.businessName.trim(),
        uen: this.uen.trim(),
        businessType: this.businessType,
        businessAddress: this.businessAddress.trim(),
        postalCode: this.postalCode.trim(),
        contactNumber: this.contactNumber.trim(),
        productCategory: this.productCategory,
        businessDescription: this.businessDescription.trim(),
        pickupAvailable: this.pickupAvailable,
        logoFile: this.logoFile,
        registrationDocument: this.businessDocument,
      })
      .subscribe({
        // ===================================================
        // SUCCESS
        // ===================================================

        next: (response: any) => {
          console.log('MERCHANT APPLICATION CREATED:', response);

          this.loading = false;

          localStorage.removeItem('pendingMerchantUserId');

          this.errorMessage = '';

          this.cdr.detectChanges();

          // =================================================
          // MERCHANT REGISTRATION COMPLETE
          // =================================================

          this.router.navigate(['/login']);
        },

        // ===================================================
        // ERROR
        // ===================================================

        error: (error: any) => {
          console.error('MERCHANT APPLICATION FAILED:', error);

          this.loading = false;

          this.errorMessage =
            this.extractErrorMessage(error) ||
            'Unable to submit merchant application. Please try again.';

          console.log('MERCHANT STEP 2 ERROR:', this.errorMessage);

          this.cdr.detectChanges();
        },
      });
  }

  // =========================================================
  // BACK TO STEP 1
  // =========================================================

  backToStep1(): void {
    this.signupStep = 1;

    this.errorMessage = '';

    this.loading = false;

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    this.cdr.detectChanges();
  }

  // =========================================================
  // ERROR MESSAGE
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

    // =======================================================
    // HTTP 409
    // =======================================================

    if (error?.status === 409) {
      return 'Username or email is already registered.';
    }

    // =======================================================
    // NO MESSAGE
    // =======================================================

    return '';
  }
}
