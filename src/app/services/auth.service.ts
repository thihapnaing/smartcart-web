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

  // =========================================================
  // IDLE TIMEOUT
  // =========================================================

  private logoutTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly idleTimeoutMs = 5 * 60 * 1000;

  private readonly activityEvents = [
    'mousemove',
    'mousedown',
    'keydown',
    'scroll',
    'touchstart',
    'click',
  ];

  private idleTimeoutStarted = false;

  // =========================================================
  // API URL
  // =========================================================

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly profileApiUrl = `${environment.apiUrl}/user-profile`;

  private readonly store = new AuthStore(localStorage, '');

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor() {
    const token = this.store.get('token');

    if (token) {
      console.log('Existing JWT found after page refresh');

      // Check that JWT has not already expired.
      if (this.isTokenExpired(token)) {
        this.logout();

        return;
      }

      // Start 5-minute idle timer.
      this.startIdleTimer();
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

        // -------------------------------------------------
        // SAVE LOGIN DATA
        // -------------------------------------------------

        this.store.set('token', response.token);

        this.store.set('username', response.username);

        this.store.set('email', response.email);

        this.store.set('role', response.role);

        // -------------------------------------------------
        // START 5-MINUTE IDLE TIMER
        // -------------------------------------------------

        this.startIdleTimer();
      }),
    );
  }

  // =========================================================
  // CUSTOMER REGISTER - STEP 1
  // =========================================================

  register(data: { username: string; email: string; password: string }): Observable<LoginResponse> {
    console.log('AUTH SERVICE REGISTER CALLED');

    console.log('Register URL:', `${this.apiUrl}/register`);

    console.log('Register username:', data.username);

    console.log('Register email:', data.email);

    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, data);
  }

  // =========================================================
  // CREATE USER PROFILE WITH AVATAR
  // =========================================================

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

    return this.http.post(`${this.apiUrl.replace('/auth', '')}/user-profile/with-avatar`, formData);
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

  // =========================================================
  // CHECK EMAIL
  // =========================================================

  checkEmail(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/check-email`, {
      email: email,
    });
  }

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  resetPassword(data: {
    email: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, data);
  }

  // =========================================================
  // IDLE TIMEOUT
  // =========================================================

  private startIdleTimer(): void {
    // Prevent duplicate event listeners.
    if (this.idleTimeoutStarted) {
      this.resetIdleTimer();

      return;
    }

    this.idleTimeoutStarted = true;

    // -------------------------------------------------------
    // LISTEN FOR USER ACTIVITY
    // -------------------------------------------------------

    this.activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, this.handleUserActivity, true);
    });

    // Start timer.
    this.resetIdleTimer();
  }

  // =========================================================
  // USER ACTIVITY
  // =========================================================

  private handleUserActivity = (): void => {
    // Only reset timer if user is logged in.
    if (!this.store.get('token')) {
      return;
    }

    this.resetIdleTimer();
  };

  // =========================================================
  // RESET IDLE TIMER
  // =========================================================

  private resetIdleTimer(): void {
    // Cancel previous timer.
    if (this.logoutTimer !== null) {
      clearTimeout(this.logoutTimer);

      this.logoutTimer = null;
    }

    // If user is not logged in,
    // don't start a logout timer.
    if (!this.store.get('token')) {
      return;
    }

    console.log('Idle timer reset - 5 minutes');

    this.logoutTimer = setTimeout(() => {
      console.log('No activity for 5 minutes - logging out');

      this.logout();

      this.router.navigate(['/login']);
    }, this.idleTimeoutMs);
  }

  // =========================================================
  // STOP IDLE TIMER
  // =========================================================

  private stopIdleTimer(): void {
    if (this.logoutTimer !== null) {
      clearTimeout(this.logoutTimer);

      this.logoutTimer = null;
    }

    if (!this.idleTimeoutStarted) {
      return;
    }

    this.activityEvents.forEach((eventName) => {
      window.removeEventListener(eventName, this.handleUserActivity, true);
    });

    this.idleTimeoutStarted = false;
  }

  // =========================================================
  // CHECK JWT EXPIRATION
  // =========================================================

  private isTokenExpired(token: string): boolean {
    try {
      const tokenParts = token.split('.');

      if (tokenParts.length !== 3) {
        return true;
      }

      const payloadBase64 = tokenParts[1];

      const payload = JSON.parse(atob(payloadBase64.replaceAll('-', '+').replaceAll('_', '/')));

      if (!payload.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);

      return payload.exp <= currentTime;
    } catch (error) {
      console.error('Invalid JWT:', error);

      return true;
    }
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  logout(message?: string): void {

    console.log('AUTH SERVICE LOGOUT CALLED');

    // Stop idle timer
    this.stopIdleTimer();

    // Clear authentication data
    this.store.clear([
      'token',
      'user',
      'username',
      'email',
      'role',
      'pendingSignupUserId'
    ]);

    console.log('Local authentication data cleared');

    // Go back to login page
    this.router.navigate(['/login'], {
      state: {
        message: message || ''
      }
    });
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

    if (this.isTokenExpired(token)) {
      this.logout();

      return false;
    }

    return true;
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

  // =========================================================
  // CREATE MERCHANT PROFILE
  // =========================================================

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
