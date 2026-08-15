import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';
import { AuthStore } from '../security/auth-store';
import { environment } from '../../environments/environment';

// Author: Junior

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  // =========================================================
  // API URLS
  // =========================================================

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly profileApiUrl = `${environment.apiUrl}/user-profile`;

  // =========================================================
  // AUTH STORE
  // =========================================================

  private readonly store = new AuthStore(localStorage, '');

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
  // LOGOUT
  // =========================================================

  logout(): void {
    console.log('AUTH SERVICE LOGOUT CALLED');

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
    return !!this.store.get('token');
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

  createMerchantProfile(
    userId: number,
    businessName: string,
    uen: string,
    businessType: string,
    businessAddress: string,
    postalCode: string,
    contactNumber: string,
    productCategory: string,
    businessDescription: string,
    pickupAvailable: boolean,
    logoFile: File | null,
    registrationDocument: File,
  ): Observable<any> {
    console.log('========================================');

    console.log('CREATE MERCHANT PROFILE CALLED');

    console.log('Merchant profile URL:', `${environment.apiUrl}/merchant/profile`);

    console.log('User ID:', userId);

    console.log('Business name:', businessName);

    console.log('UEN:', uen);

    console.log('Business type:', businessType);

    console.log('Pickup available:', pickupAvailable);

    console.log('========================================');

    // =======================================================
    // CREATE MULTIPART FORM DATA
    // =======================================================

    const formData = new FormData();

    // User ID

    formData.append('userId', String(userId));

    // Business information

    formData.append('businessName', businessName);

    formData.append('uen', uen);

    formData.append('businessType', businessType);

    formData.append('businessAddress', businessAddress);

    formData.append('postalCode', postalCode);

    formData.append('contactNumber', contactNumber);

    formData.append('productCategory', productCategory);

    formData.append('businessDescription', businessDescription);

    formData.append('pickupAvailable', String(pickupAvailable));

    // =======================================================
    // BUSINESS LOGO
    // =======================================================

    if (logoFile) {
      console.log('Uploading logo:', logoFile.name, logoFile.size, logoFile.type);

      formData.append('logo', logoFile, logoFile.name);
    } else {
      console.log('No business logo selected');
    }

    // =======================================================
    // REGISTRATION DOCUMENT
    // =======================================================

    console.log(
      'Uploading registration document:',
      registrationDocument.name,
      registrationDocument.size,
      registrationDocument.type,
    );

    formData.append('registrationDocument', registrationDocument, registrationDocument.name);

    // =======================================================
    // SEND REQUEST
    // =======================================================

    return this.http.post<any>(`${environment.apiUrl}/merchant/profile`, formData);
  }
}
