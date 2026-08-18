import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

import {
  AuthService,
  MerchantProfileData,
} from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  const apiUrl = `${environment.apiUrl}/auth`;

  // ---------------------------------------------------------
  // JWT TEST HELPERS
  // ---------------------------------------------------------

  function createJwt(exp: number, extra: Record<string, unknown> = {}): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

    const payload = btoa(
      JSON.stringify({
        sub: '2',
        exp,
        ...extra,
      }),
    );

    return `${header}.${payload}.signature`;
  }

  function createUrlSafeJwt(
    exp: number,
    extra: Record<string, unknown> = {},
  ): string {
    const token = createJwt(exp, extra);

    return token
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  // ---------------------------------------------------------
  // TESTBED SETUP
  // ---------------------------------------------------------

  function configureTestBed(): void {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: routerMock,
        },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  // ---------------------------------------------------------
  // SETUP
  // ---------------------------------------------------------

  beforeEach(() => {
    localStorage.clear();

    vi.useRealTimers();

    routerMock = {
      navigate: vi.fn(),
    };

    configureTestBed();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    vi.useRealTimers();
  });

  // =========================================================
  // BASIC
  // =========================================================

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  // =========================================================
  // LOGIN
  // =========================================================

  it('should login successfully and save JWT/user information', async () => {
    const token = createJwt(
      Math.floor(Date.now() / 1000) + 300,
    );

    const request = {
      email: 'junior@example.com',
      password: 'Password1',
    };

    const response = {
      token,
      username: 'Junior',
      email: 'junior@example.com',
      role: 'USER',
    };

    const promise = firstValueFrom(service.login(request));

    const req = httpMock.expectOne(`${apiUrl}/login`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);

    req.flush(response);

    await promise;

    expect(localStorage.getItem('token')).toBe(token);
    expect(localStorage.getItem('username')).toBe('Junior');
    expect(localStorage.getItem('email')).toBe('junior@example.com');
    expect(localStorage.getItem('role')).toBe('USER');
  });

  // =========================================================
  // REGISTER
  // =========================================================

  it('should register a customer', async () => {
    const data = {
      username: 'junior',
      email: 'junior@example.com',
      password: 'Password1',
    };

    const response = {
      token: 'registration-token',
      username: 'junior',
      email: 'junior@example.com',
      role: 'USER',
    };

    const promise = firstValueFrom(service.register(data));

    const req = httpMock.expectOne(`${apiUrl}/register`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(data);

    req.flush(response);

    await expect(promise).resolves.toEqual(response);
  });

  // =========================================================
  // USER PROFILE WITH AVATAR
  // =========================================================

  it('should create a user profile with an avatar', async () => {
    const avatar = new File(
      ['avatar-content'],
      'avatar.png',
      { type: 'image/png' },
    );

    const promise = firstValueFrom(
      service.createUserProfileWithAvatar(
        2,
        'Junior',
        'Tan',
        '12 Rainbow Street',
        '123456',
        '91234567',
        avatar,
      ),
    );

    const req = httpMock.expectOne(
      `${environment.apiUrl}/user-profile/with-avatar`,
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);

    const formData = req.request.body as FormData;

    expect(formData.get('userId')).toBe('2');
    expect(formData.get('firstName')).toBe('Junior');
    expect(formData.get('lastName')).toBe('Tan');
    expect(formData.get('address')).toBe('12 Rainbow Street');
    expect(formData.get('postalCode')).toBe('123456');
    expect(formData.get('phoneNumber')).toBe('91234567');

    const receivedAvatar = formData.get('avatar') as File;

    expect(receivedAvatar).toBeTruthy();
    expect(receivedAvatar.name).toBe('avatar.png');
    expect(receivedAvatar.type).toBe('image/png');

    req.flush({ success: true });

    await expect(promise).resolves.toEqual({ success: true });
  });

  it('should create a user profile without an avatar', async () => {
    const promise = firstValueFrom(
      service.createUserProfileWithAvatar(
        2,
        'Junior',
        'Tan',
        '12 Rainbow Street',
        '123456',
        '91234567',
        null,
      ),
    );

    const req = httpMock.expectOne(
      `${environment.apiUrl}/user-profile/with-avatar`,
    );

    const formData = req.request.body as FormData;

    expect(formData.get('userId')).toBe('2');
    expect(formData.get('firstName')).toBe('Junior');
    expect(formData.get('lastName')).toBe('Tan');
    expect(formData.get('avatar')).toBeNull();

    req.flush({ success: true });

    await expect(promise).resolves.toEqual({ success: true });
  });

  // =========================================================
  // USER PROFILE
  // =========================================================

  it('should create a user profile', async () => {
    const data = {
      userId: 2,
      firstName: 'Junior',
      lastName: 'Tan',
      address: '12 Rainbow Street',
      postalCode: '123456',
      phoneNumber: '91234567',
      avatarUrl: '/uploads/avatar.png',
    };

    const response = {
      id: 10,
      ...data,
    };

    const promise = firstValueFrom(service.createUserProfile(data));

    const req = httpMock.expectOne(`${environment.apiUrl}/user-profile`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(data);

    req.flush(response);

    await expect(promise).resolves.toEqual(response);
  });

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  it('should check whether an email exists', async () => {
    const promise = firstValueFrom(
      service.checkEmail('junior@example.com'),
    );

    const req = httpMock.expectOne(`${apiUrl}/check-email`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'junior@example.com',
    });

    req.flush({ exists: true });

    await expect(promise).resolves.toEqual({ exists: true });
  });

  it('should reset the password', async () => {
    const data = {
      email: 'junior@example.com',
      newPassword: 'NewPassword1',
      confirmPassword: 'NewPassword1',
    };

    const promise = firstValueFrom(service.resetPassword(data));

    const req = httpMock.expectOne(`${apiUrl}/reset-password`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(data);

    req.flush({ message: 'Password updated successfully.' });

    await expect(promise).resolves.toEqual({
      message: 'Password updated successfully.',
    });
  });

  // =========================================================
  // MERCHANT REGISTER
  // =========================================================

  it('should register a merchant', async () => {
    const data = {
      username: 'merchant',
      email: 'merchant@example.com',
      password: 'Password1',
    };

    const response = {
      message: 'Merchant registered successfully.',
    };

    const promise = firstValueFrom(service.registerMerchant(data));

    const req = httpMock.expectOne(`${apiUrl}/merchant/register`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(data);

    req.flush(response);

    await expect(promise).resolves.toEqual(response);
  });

  // =========================================================
  // MERCHANT PROFILE
  // =========================================================

  it('should create a merchant profile with logo and registration document', async () => {
    const logoFile = new File(
      ['logo-content'],
      'logo.png',
      { type: 'image/png' },
    );

    const registrationDocument = new File(
      ['registration-content'],
      'registration.pdf',
      { type: 'application/pdf' },
    );

    const data: MerchantProfileData = {
      userId: 2,
      businessName: 'SmartCart Fashion',
      uen: '202612345A',
      businessType: 'Retail',
      businessAddress: '12 Rainbow Street',
      postalCode: '123456',
      contactNumber: '91234567',
      productCategory: 'Fashion',
      businessDescription: 'Fashion retailer in Singapore.',
      pickupAvailable: true,
      logoFile,
      registrationDocument,
    };

    const promise = firstValueFrom(service.createMerchantProfile(data));

    const req = httpMock.expectOne(
      `${environment.apiUrl}/merchant/profile`,
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);

    const formData = req.request.body as FormData;

    expect(formData.get('userId')).toBe('2');
    expect(formData.get('businessName')).toBe('SmartCart Fashion');
    expect(formData.get('uen')).toBe('202612345A');
    expect(formData.get('businessType')).toBe('Retail');
    expect(formData.get('businessAddress')).toBe('12 Rainbow Street');
    expect(formData.get('postalCode')).toBe('123456');
    expect(formData.get('contactNumber')).toBe('91234567');
    expect(formData.get('productCategory')).toBe('Fashion');
    expect(formData.get('businessDescription')).toBe(
      'Fashion retailer in Singapore.',
    );
    expect(formData.get('pickupAvailable')).toBe('true');

    const receivedLogo = formData.get('logo') as File;
    expect(receivedLogo).toBeTruthy();
    expect(receivedLogo.name).toBe('logo.png');
    expect(receivedLogo.type).toBe('image/png');

    const receivedDocument = formData.get(
      'registrationDocument',
    ) as File;

    expect(receivedDocument).toBeTruthy();
    expect(receivedDocument.name).toBe('registration.pdf');
    expect(receivedDocument.type).toBe('application/pdf');

    req.flush({ success: true });

    await expect(promise).resolves.toEqual({ success: true });
  });

  it('should create a merchant profile without a logo', async () => {
    const registrationDocument = new File(
      ['registration-content'],
      'registration.pdf',
      { type: 'application/pdf' },
    );

    const data: MerchantProfileData = {
      userId: 2,
      businessName: 'SmartCart Fashion',
      uen: '202612345A',
      businessType: 'Retail',
      businessAddress: '12 Rainbow Street',
      postalCode: '123456',
      contactNumber: '91234567',
      productCategory: 'Fashion',
      businessDescription: 'Fashion retailer in Singapore.',
      pickupAvailable: false,
      logoFile: null,
      registrationDocument,
    };

    const promise = firstValueFrom(service.createMerchantProfile(data));

    const req = httpMock.expectOne(
      `${environment.apiUrl}/merchant/profile`,
    );

    expect(req.request.method).toBe('POST');

    const formData = req.request.body as FormData;

    expect(formData.get('userId')).toBe('2');
    expect(formData.get('businessName')).toBe('SmartCart Fashion');
    expect(formData.get('pickupAvailable')).toBe('false');

    // No logo should be appended.
    expect(formData.get('logo')).toBeNull();

    const receivedDocument = formData.get(
      'registrationDocument',
    ) as File;

    expect(receivedDocument).toBeTruthy();
    expect(receivedDocument.name).toBe('registration.pdf');
    expect(receivedDocument.type).toBe('application/pdf');

    req.flush({ success: true });

    await expect(promise).resolves.toEqual({ success: true });
  });

  // =========================================================
  // LOGOUT
  // =========================================================

  it('should clear authentication data when logout is called', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', 'test-user');
    localStorage.setItem('username', 'Junior');
    localStorage.setItem('email', 'junior@example.com');
    localStorage.setItem('role', 'USER');
    localStorage.setItem('pendingSignupUserId', '2');

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
    expect(localStorage.getItem('email')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
    expect(localStorage.getItem('pendingSignupUserId')).toBeNull();
  });

  // =========================================================
  // CLEAR SESSION
  // =========================================================

  it('should clear the authentication session', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('username', 'Junior');
    localStorage.setItem('email', 'junior@example.com');
    localStorage.setItem('role', 'USER');

    service.clearSession();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
    expect(localStorage.getItem('email')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
  });

  // =========================================================
  // LOGIN STATUS
  // =========================================================

  it('should return false when there is no token', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should return true when JWT has not expired', () => {
    const token = createJwt(
      Math.floor(Date.now() / 1000) + 300,
    );

    localStorage.setItem('token', token);

    expect(service.isLoggedIn()).toBe(true);
  });

  it('should return false and logout when JWT is expired', () => {
    const token = createJwt(
      Math.floor(Date.now() / 1000) - 10,
    );

    localStorage.setItem('token', token);
    localStorage.setItem('username', 'Junior');
    localStorage.setItem('email', 'junior@example.com');
    localStorage.setItem('role', 'USER');

    expect(service.isLoggedIn()).toBe(false);

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
    expect(localStorage.getItem('email')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
  });

  it('should return false for an invalid JWT and clear the session', () => {
    localStorage.setItem('token', 'invalid-token');
    localStorage.setItem('username', 'Junior');

    expect(service.isLoggedIn()).toBe(false);

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
  });

  it('should return false when JWT has no exp claim', () => {
    const token = createJwt(
      Math.floor(Date.now() / 1000) + 300,
    );

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: '2' }));

    const tokenWithoutExp = `${header}.${payload}.signature`;

    localStorage.setItem('token', tokenWithoutExp);

    expect(service.isLoggedIn()).toBe(false);
  });

  // =========================================================
  // USER INFORMATION
  // =========================================================

  it('should return username from storage', () => {
    localStorage.setItem('username', 'Junior');

    expect(service.getUsername()).toBe('Junior');
  });

  it('should return empty username when not stored', () => {
    expect(service.getUsername()).toBe('');
  });

  it('should return email from storage', () => {
    localStorage.setItem('email', 'junior@example.com');

    expect(service.getEmail()).toBe('junior@example.com');
  });

  it('should return empty email when not stored', () => {
    expect(service.getEmail()).toBe('');
  });

  it('should return role from storage', () => {
    localStorage.setItem('role', 'USER');

    expect(service.getRole()).toBe('USER');
  });

  it('should return empty role when not stored', () => {
    expect(service.getRole()).toBe('');
  });

  // =========================================================
  // IDLE TIMEOUT
  // =========================================================

  it('should automatically logout after 5 minutes of inactivity', () => {
    vi.useFakeTimers();

    const now = Date.now();
    vi.setSystemTime(now);

    const token = createJwt(Math.floor(now / 1000) + 1800);

    localStorage.setItem('token', token);
    localStorage.setItem('username', 'Junior');
    localStorage.setItem('email', 'junior@example.com');
    localStorage.setItem('role', 'USER');

    TestBed.resetTestingModule();
    configureTestBed();

    expect(localStorage.getItem('token')).toBe(token);

    vi.advanceTimersByTime(5 * 60 * 1000 + 1);

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
    expect(localStorage.getItem('email')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should remain logged in when the user is active before 5 minutes', () => {
    vi.useFakeTimers();

    const now = Date.now();
    vi.setSystemTime(now);

    const token = createJwt(Math.floor(now / 1000) + 1800);

    localStorage.setItem('token', token);
    localStorage.setItem('username', 'Junior');
    localStorage.setItem('email', 'junior@example.com');
    localStorage.setItem('role', 'USER');

    TestBed.resetTestingModule();
    configureTestBed();

    vi.advanceTimersByTime(4 * 60 * 1000);
    expect(localStorage.getItem('token')).toBe(token);
    expect(routerMock.navigate).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('mousemove'));

    vi.advanceTimersByTime(4 * 60 * 1000);

    expect(localStorage.getItem('token')).toBe(token);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should logout 5 minutes after the last user activity', () => {
    vi.useFakeTimers();

    const now = Date.now();
    vi.setSystemTime(now);

    const token = createJwt(Math.floor(now / 1000) + 1800);
    localStorage.setItem('token', token);

    TestBed.resetTestingModule();
    configureTestBed();

    vi.advanceTimersByTime(4 * 60 * 1000);
    window.dispatchEvent(new Event('click'));

    vi.advanceTimersByTime(4 * 60 * 1000);
    expect(localStorage.getItem('token')).toBe(token);
    expect(routerMock.navigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60 * 1000 + 1);

    expect(localStorage.getItem('token')).toBeNull();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should reset the idle timer when keyboard activity occurs', () => {
    vi.useFakeTimers();

    const now = Date.now();
    vi.setSystemTime(now);

    const token = createJwt(Math.floor(now / 1000) + 1800);
    localStorage.setItem('token', token);

    TestBed.resetTestingModule();
    configureTestBed();

    vi.advanceTimersByTime(4 * 60 * 1000);
    window.dispatchEvent(new Event('keydown'));
    vi.advanceTimersByTime(4 * 60 * 1000);

    expect(localStorage.getItem('token')).toBe(token);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should reset the idle timer when scrolling occurs', () => {
    vi.useFakeTimers();

    const now = Date.now();
    vi.setSystemTime(now);

    const token = createJwt(Math.floor(now / 1000) + 1800);
    localStorage.setItem('token', token);

    TestBed.resetTestingModule();
    configureTestBed();

    vi.advanceTimersByTime(4 * 60 * 1000);
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(4 * 60 * 1000);

    expect(localStorage.getItem('token')).toBe(token);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should start the 5-minute idle timer after successful login', async () => {
    vi.useFakeTimers();

    const now = Date.now();
    vi.setSystemTime(now);

    const token = createJwt(Math.floor(now / 1000) + 1800);

    const promise = firstValueFrom(
      service.login({
        email: 'junior@example.com',
        password: 'Password1',
      }),
    );

    const req = httpMock.expectOne(`${apiUrl}/login`);

    req.flush({
      token,
      username: 'Junior',
      email: 'junior@example.com',
      role: 'USER',
    });

    await promise;

    expect(localStorage.getItem('token')).toBe(token);

    vi.advanceTimersByTime(4 * 60 * 1000);
    expect(localStorage.getItem('token')).toBe(token);
    expect(routerMock.navigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60 * 1000 + 1);

    expect(localStorage.getItem('token')).toBeNull();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should cancel the idle timer when logout is called', () => {
    vi.useFakeTimers();

    const now = Date.now();
    vi.setSystemTime(now);

    const token = createJwt(Math.floor(now / 1000) + 1800);
    localStorage.setItem('token', token);

    TestBed.resetTestingModule();
    configureTestBed();

    service.logout();
    vi.advanceTimersByTime(5 * 60 * 1000 + 1000);

    expect(localStorage.getItem('token')).toBeNull();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  // =========================================================
  // URL-SAFE JWT
  // =========================================================

  it('should accept a URL-safe JWT payload when checking login status', () => {
    const token = createUrlSafeJwt(
      Math.floor(Date.now() / 1000) + 300,
    );

    localStorage.setItem('token', token);

    expect(service.isLoggedIn()).toBe(true);
  });
});
