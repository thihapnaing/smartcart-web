  import { Injectable, inject } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { Router } from '@angular/router';
  import { Observable, tap } from 'rxjs';

  import { LoginRequest } from '../models/login-request';
  import { LoginResponse } from '../models/login-response';
  import { AuthStore } from '../security/auth-store';
  import { environment } from '../../environments/environment';

  // Author: Junior

  export interface MerchantProfileData {
    userId: number;
    businessName: string;
    uen: string;
    businessType: string;
    businessAddress: string;
    postalCode: string;
    contactNumber: string;
    productCategory: string;
    businessDescription: string;
    pickupAvailable: boolean;
    logoFile: File | null;
    registrationDocument: File;
  }

  @Injectable({
    providedIn: 'root',
  })
  export class AuthService {
    private readonly router = inject(Router);
    private readonly http = inject(HttpClient);

    private logoutTimer: ReturnType<typeof setTimeout> | null = null;

    private readonly apiUrl = `${environment.apiUrl}/auth`;

    private readonly profileApiUrl = `${environment.apiUrl}/user-profile`;

    private readonly store = new AuthStore(localStorage, '');

    constructor() {
      const token = this.store.get('token');

      if (token) {
        console.log('Existing JWT found after page refresh');

        this.startLogoutTimer(token);
      }
    }

    // =========================================================
    // LOGIN
    // =========================================================

    login(request: LoginRequest): Observable<LoginResponse> {
      console.log('AUTH SERVICE LOGIN CALLED');

      console.log('Login URL:', `${this.apiUrl}/login`);

      console.log('Login email:', request.email);

      return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
        tap((response) => {
          console.log('LOGIN RESPONSE:', response);

          this.store.set('token', response.token);

          this.store.set('username', response.username);

          this.store.set('email', response.email);

          this.store.set('role', response.role);
          this.startLogoutTimer(response.token);
        }),
      );
    }

    // =========================================================
    // CUSTOMER REGISTER - STEP 1
    // =========================================================

    register(data: {
      username: string;
      email: string;
      password: string;
    }): Observable<LoginResponse> {
      console.log('AUTH SERVICE REGISTER CALLED');

      console.log('Register URL:', `${this.apiUrl}/register`);

      console.log('Register username:', data.username);

      console.log('Register email:', data.email);

      return this.http.post<LoginResponse>(`${this.apiUrl}/register`, data);
    }

    createUserProfileWithAvatar(
      userId: number,
      firstName: string,
      lastName: string,
      address: string,
      postalCode: string,
      phoneNumber: string,
      avatarFile: File | null,
    ) {
      const formData = new FormData();

      formData.append('userId', userId.toString());

      formData.append('firstName', firstName);

      formData.append('lastName', lastName);

      formData.append('address', address);

      formData.append('postalCode', postalCode);

      formData.append('phoneNumber', phoneNumber);

      // Avatar is optional
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      return this.http.post(
        `${this.apiUrl.replace('/auth', '')}/user-profile/with-avatar`,
        formData,
      );
    }

    // =========================================================
    // CREATE USER PROFILE - STEP 2
    // =========================================================

    createUserProfile(data: {
      userId: number;
      firstName: string;
      lastName: string;
      address: string;
      postalCode: string;
      phoneNumber: string;
      avatarUrl?: string;
    }): Observable<any> {
      console.log('AUTH SERVICE CREATE USER PROFILE CALLED');

      console.log('Profile URL:', this.profileApiUrl);

      console.log('Profile data:', data);

      return this.http.post<any>(this.profileApiUrl, data);
    }

    //reset password
    checkEmail(email: string): Observable<any> {
      return this.http.post<any>(`${this.apiUrl}/check-email`, {
        email: email,
      });
    }

    resetPassword(data: {
      email: string;
      newPassword: string;
      confirmPassword: string;
    }): Observable<any> {
      return this.http.post<any>(`${this.apiUrl}/reset-password`, data);
    }

    // =========================================================
    // AUTOMATIC JWT EXPIRATION
    // =========================================================

    private startLogoutTimer(token: string): void {
      // ---------------------------------------------------------
      // CANCEL PREVIOUS TIMER
      // ---------------------------------------------------------

      if (this.logoutTimer) {
        clearTimeout(this.logoutTimer);
        this.logoutTimer = null;
      }

      try {
        // -------------------------------------------------------
        // DECODE JWT PAYLOAD
        // -------------------------------------------------------

        const payloadBase64 = token.split('.')[1];

        if (!payloadBase64) {
          console.error('Invalid JWT token');

          this.logout();
          this.router.navigate(['/login']);

          return;
        }

        const payload = JSON.parse(atob(payloadBase64.replaceAll('-', '+').replaceAll('_', '/')));

        // -------------------------------------------------------
        // JWT EXPIRATION
        // -------------------------------------------------------

        const expirationTime = payload.exp;

        if (!expirationTime) {
          console.error('JWT does not contain exp');

          this.logout();
          this.router.navigate(['/login']);

          return;
        }

        // JWT exp is in seconds.
        // Date.now() is in milliseconds.
        const expiresIn = expirationTime * 1000 - Date.now();

        console.log('JWT expires in:', Math.round(expiresIn / 1000), 'seconds');

        // -------------------------------------------------------
        // ALREADY EXPIRED
        // -------------------------------------------------------

        if (expiresIn <= 0) {
          console.log('JWT already expired');

          this.logout();
          this.router.navigate(['/login']);

          return;
        }

        // -------------------------------------------------------
        // START TIMER
        // -------------------------------------------------------

        this.logoutTimer = setTimeout(() => {
          console.log('JWT expired - logging out');

          this.logout();

          this.router.navigate(['/login']);
        }, expiresIn);
      } catch (error) {
        console.error('Unable to decode JWT:', error);

        this.logout();

        this.router.navigate(['/login']);
      }
    }

    // =========================================================
    // LOGOUT
    // =========================================================

    logout(): void {
      console.log('AUTH SERVICE LOGOUT CALLED');

      // Cancel automatic JWT expiration timer
      if (this.logoutTimer) {
        clearTimeout(this.logoutTimer);
        this.logoutTimer = null;
      }

      this.store.clear(['token', 'user', 'username', 'email', 'role', 'pendingSignupUserId']);

      console.log('Local authentication data cleared');
    }

    // =========================================================
    // CLEAR SESSION
    // =========================================================

    clearSession(): void {
      this.store.clear(['token', 'username', 'email', 'role']);
    }

    // =========================================================
    // LOGIN STATUS
    // =========================================================

    isLoggedIn(): boolean {
      const token = this.store.get('token');

      if (!token) {
        return false;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        if (!payload.exp) {
          return false;
        }

        const currentTime = Math.floor(Date.now() / 1000);

        if (payload.exp <= currentTime) {
          this.logout();
          return false;
        }

        return true;
      } catch (error) {
        console.error('Invalid JWT:', error);

        this.logout();
        return false;
      }
    }

    // =========================================================
    // GET USERNAME
    // =========================================================

    getUsername(): string {
      return this.store.get('username') || '';
    }

    // =========================================================
    // GET EMAIL
    // =========================================================

    getEmail(): string {
      return this.store.get('email') || '';
    }

    // =========================================================
    // GET ROLE
    // =========================================================

    getRole(): string {
      return this.store.get('role') || '';
    }

    // =========================================================
    // MERCHANT REGISTER
    // =========================================================

    registerMerchant(request: {
      username: string;
      email: string;
      password: string;
    }): Observable<any> {
      console.log('========================================');

      console.log('MERCHANT REGISTER CALLED');

      console.log('Merchant Register URL:', `${this.apiUrl}/merchant/register`);

      console.log('Merchant username:', request.username);

      console.log('Merchant email:', request.email);

      console.log('========================================');

      return this.http.post<any>(`${this.apiUrl}/merchant/register`, request);
    }

    createMerchantProfile(data: MerchantProfileData): Observable<any> {
      console.log('========================================');
      console.log('CREATE MERCHANT PROFILE CALLED');
      console.log('Merchant profile URL:', `${environment.apiUrl}/merchant/profile`);
      console.log('User ID:', data.userId);
      console.log('Business name:', data.businessName);
      console.log('UEN:', data.uen);
      console.log('Business type:', data.businessType);
      console.log('Pickup available:', data.pickupAvailable);
      console.log('========================================');

      // =======================================================
      // CREATE MULTIPART FORM DATA
      // =======================================================

      const formData = new FormData();

      // User ID
      formData.append('userId', String(data.userId));

      // Business information
      formData.append('businessName', data.businessName);
      formData.append('uen', data.uen);
      formData.append('businessType', data.businessType);
      formData.append('businessAddress', data.businessAddress);
      formData.append('postalCode', data.postalCode);
      formData.append('contactNumber', data.contactNumber);
      formData.append('productCategory', data.productCategory);
      formData.append('businessDescription', data.businessDescription);
      formData.append('pickupAvailable', String(data.pickupAvailable));

      // =======================================================
      // BUSINESS LOGO
      // =======================================================

      if (data.logoFile) {
        console.log('Uploading logo:', data.logoFile.name, data.logoFile.size, data.logoFile.type);

        formData.append('logo', data.logoFile, data.logoFile.name);
      } else {
        console.log('No business logo selected');
      }

      // =======================================================
      // REGISTRATION DOCUMENT
      // =======================================================

      console.log(
        'Uploading registration document:',
        data.registrationDocument.name,
        data.registrationDocument.size,
        data.registrationDocument.type,
      );

      formData.append(
        'registrationDocument',
        data.registrationDocument,
        data.registrationDocument.name,
      );

      // =======================================================
      // SEND REQUEST
      // =======================================================

      return this.http.post<any>(`${environment.apiUrl}/merchant/profile`, formData);
    }
  }
