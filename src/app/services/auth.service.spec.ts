import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AuthService, MerchantProfileData } from './auth.service';
import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';
import { environment } from '../../environments/environment';

//Author: Htet Nandar
//Updated: Junior

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  const apiUrl = `${environment.apiUrl}/auth`;

  // =========================================================
  // JWT HELPER
  // =========================================================

  function createJwt(expiresInSeconds: number, extraPayload: Record<string, unknown> = {}): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const payload = {
      sub: '1',
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
      ...extraPayload,
    };

    const encode = (value: unknown): string => {
      return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    return `${encode(header)}.${encode(payload)}.signature`;
  }

  function createExpiredJwt(): string {
    return createJwt(-60);
  }

  // =========================================================
  // TEST LOGIN RESPONSES
  // =========================================================

  const customerToken = createJwt(300);

  const customerLoginResponse: LoginResponse = {
    token: customerToken,
    userId: 1,
    username: 'john',
    email: 'john@smartcart.com',
    role: 'CUSTOMER',
  };

  const merchantToken = createJwt(300);

  const merchantLoginResponse: LoginResponse = {
    token: merchantToken,
    userId: 2,
    username: 'merchant01',
    email: 'merchant@example.com',
    role: 'MERCHANT',
  };

  // =========================================================
  // BEFORE EACH
  // =========================================================

  beforeEach(() => {
    vi.useFakeTimers();

    localStorage.clear();

    routerMock = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
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
  });

  // =========================================================
  // AFTER EACH
  // =========================================================

  afterEach(() => {
    httpMock.verify();

    localStorage.clear();

    vi.clearAllTimers();

    vi.useRealTimers();
  });

  // =========================================================
  // SERVICE
  // =========================================================

  describe('service', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  // =========================================================
  // LOGIN
  // =========================================================

  describe('login', () => {
    it('should call the login endpoint', () => {
      const request: LoginRequest = {
        email: 'john@smartcart.com',
        password: 'Password1',
      };

      service.login(request).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);

      expect(req.request.method).toBe('POST');

      expect(req.request.body).toEqual(request);

      req.flush(customerLoginResponse);
    });

    it('should return the login response', () => {
      const request: LoginRequest = {
        email: 'john@smartcart.com',
        password: 'Password1',
      };

      let actualResponse: LoginResponse | undefined;

      service.login(request).subscribe((response) => {
        actualResponse = response;
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);

      req.flush(customerLoginResponse);

      expect(actualResponse).toEqual(customerLoginResponse);
    });

    it('should store token after successful login', () => {
      const request: LoginRequest = {
        email: 'john@smartcart.com',
        password: 'Password1',
      };

      service.login(request).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);

      req.flush(customerLoginResponse);

      expect(localStorage.getItem('token')).toBe(customerToken);
    });

    it('should store username after successful login', () => {
      const request: LoginRequest = {
        email: 'john@smartcart.com',
        password: 'Password1',
      };

      service.login(request).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);

      req.flush(customerLoginResponse);

      expect(localStorage.getItem('username')).toBe('john');
    });

    it('should store email after successful login', () => {
      const request: LoginRequest = {
        email: 'john@smartcart.com',
        password: 'Password1',
      };

      service.login(request).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);

      req.flush(customerLoginResponse);

      expect(localStorage.getItem('email')).toBe('john@smartcart.com');
    });

    it('should store role after successful login', () => {
      const request: LoginRequest = {
        email: 'john@smartcart.com',
        password: 'Password1',
      };

      service.login(request).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);

      req.flush(customerLoginResponse);

      expect(localStorage.getItem('role')).toBe('CUSTOMER');
    });

    it('should start the automatic logout timer after login', () => {
      const request: LoginRequest = {
        email: 'john@smartcart.com',
        password: 'Password1',
      };

      service.login(request).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);

      req.flush(customerLoginResponse);

      expect(localStorage.getItem('token')).toBe(customerToken);

      vi.advanceTimersByTime(299_000);

      expect(localStorage.getItem('token')).toBe(customerToken);

      vi.advanceTimersByTime(2_000);

      expect(localStorage.getItem('token')).toBeNull();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should propagate login errors', () => {
      const request: LoginRequest = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      let actualError: any;

      service.login(request).subscribe({
        error: (error) => {
          actualError = error;
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);

      expect(req.request.method).toBe('POST');

      req.flush(
        {
          message: 'Invalid email or password',
        },
        {
          status: 401,
          statusText: 'Unauthorized',
        },
      );

      expect(actualError).toBeTruthy();

      expect(actualError.status).toBe(401);

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  // =========================================================
  // CUSTOMER REGISTER
  // =========================================================

  describe('register', () => {
    it('should register a customer', () => {
      const data = {
        username: 'john',
        email: 'john@example.com',
        password: 'Password1',
      };

      const response: LoginResponse = {
        token: createJwt(300),
        userId: 1,
        username: 'john',
        email: 'john@example.com',
        role: 'CUSTOMER',
      };

      let actualResponse: LoginResponse | undefined;

      service.register(data).subscribe((result) => {
        actualResponse = result;
      });

      const req = httpMock.expectOne(`${apiUrl}/register`);

      expect(req.request.method).toBe('POST');

      expect(req.request.body).toEqual(data);

      req.flush(response);

      expect(actualResponse).toEqual(response);
    });

    it('should propagate registration errors', () => {
      const data = {
        username: 'john',
        email: 'john@example.com',
        password: 'Password1',
      };

      let actualError: any;

      service.register(data).subscribe({
        error: (error) => {
          actualError = error;
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/register`);

      req.flush(
        {
          message: 'Email is already registered',
        },
        {
          status: 400,
          statusText: 'Bad Request',
        },
      );

      expect(actualError).toBeTruthy();

      expect(actualError.status).toBe(400);
    });
  });

  // =========================================================
  // CREATE USER PROFILE WITH AVATAR
  // =========================================================

  describe('createUserProfileWithAvatar', () => {
    it('should create a user profile with avatar', () => {
      const avatarFile = new File(['fake-avatar'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      service
        .createUserProfileWithAvatar(
          1,
          'John',
          'Tan',
          '12 Rainbow Street',
          '123456',
          '91234567',
          avatarFile,
        )
        .subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/user-profile/with-avatar`);

      expect(req.request.method).toBe('POST');

      expect(req.request.body).toBeInstanceOf(FormData);

      const formData = req.request.body as FormData;

      expect(formData.get('userId')).toBe('1');

      expect(formData.get('firstName')).toBe('John');

      expect(formData.get('lastName')).toBe('Tan');

      expect(formData.get('address')).toBe('12 Rainbow Street');

      expect(formData.get('postalCode')).toBe('123456');

      expect(formData.get('phoneNumber')).toBe('91234567');

      const uploadedAvatar = formData.get('avatar') as File;

      expect(uploadedAvatar).toBeTruthy();

      expect(uploadedAvatar.name).toBe('avatar.jpg');

      expect(uploadedAvatar.type).toBe('image/jpeg');

      expect(uploadedAvatar.size).toBe(avatarFile.size);

      req.flush({
        message: 'Profile created',
      });
    });

    it('should create a user profile without avatar', () => {
      service
        .createUserProfileWithAvatar(
          1,
          'John',
          'Tan',
          '12 Rainbow Street',
          '123456',
          '91234567',
          null,
        )
        .subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/user-profile/with-avatar`);

      expect(req.request.method).toBe('POST');

      expect(req.request.body).toBeInstanceOf(FormData);

      const formData = req.request.body as FormData;

      expect(formData.get('userId')).toBe('1');

      expect(formData.get('firstName')).toBe('John');

      expect(formData.get('lastName')).toBe('Tan');

      expect(formData.get('address')).toBe('12 Rainbow Street');

      expect(formData.get('postalCode')).toBe('123456');

      expect(formData.get('phoneNumber')).toBe('91234567');

      expect(formData.get('avatar')).toBeNull();

      req.flush({
        message: 'Profile created',
      });
    });
  });

  // =========================================================
  // CREATE USER PROFILE
  // =========================================================

  describe('createUserProfile', () => {
    it('should create a user profile', () => {
      const data = {
        userId: 1,
        firstName: 'John',
        lastName: 'Tan',
        address: '12 Rainbow Street',
        postalCode: '123456',
        phoneNumber: '91234567',
        avatarUrl: 'avatar.jpg',
      };

      const response = {
        id: 10,
        ...data,
      };

      let actualResponse: any;

      service.createUserProfile(data).subscribe((result) => {
        actualResponse = result;
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user-profile`);

      expect(req.request.method).toBe('POST');

      expect(req.request.body).toEqual(data);

      req.flush(response);

      expect(actualResponse).toEqual(response);
    });
  });

  // =========================================================
  // CHECK EMAIL
  // =========================================================

  describe('checkEmail', () => {
    it('should call the check-email endpoint', () => {
      const email = 'john@smartcart.com';

      service.checkEmail(email).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/check-email`);

      expect(req.request.method).toBe('POST');

      expect(req.request.body).toEqual({
        email,
      });

      req.flush({
        message: 'Email address found',
      });
    });

    it('should return the check-email response', () => {
      const email = 'john@smartcart.com';

      const response = {
        message: 'Email address found',
      };

      let actualResponse: any;

      service.checkEmail(email).subscribe((result) => {
        actualResponse = result;
      });

      const req = httpMock.expectOne(`${apiUrl}/check-email`);

      req.flush(response);

      expect(actualResponse).toEqual(response);
    });

    it('should propagate check-email errors', () => {
      const email = 'unknown@smartcart.com';

      let actualError: any;

      service.checkEmail(email).subscribe({
        error: (error) => {
          actualError = error;
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/check-email`);

      req.flush(
        {
          message: 'Email address not found',
        },
        {
          status: 404,
          statusText: 'Not Found',
        },
      );

      expect(actualError).toBeTruthy();

      expect(actualError.status).toBe(404);
    });
  });

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  describe('resetPassword', () => {
    it('should call the reset-password endpoint', () => {
      const data = {
        email: 'john@smartcart.com',
        newPassword: 'Password1',
        confirmPassword: 'Password1',
      };

      service.resetPassword(data).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/reset-password`);

      expect(req.request.method).toBe('POST');

      expect(req.request.body).toEqual(data);

      req.flush({
        message: 'Password updated successfully.',
      });
    });

    it('should return the reset-password response', () => {
      const data = {
        email: 'john@smartcart.com',
        newPassword: 'Password1',
        confirmPassword: 'Password1',
      };

      const response = {
        message: 'Password updated successfully.',
      };

      let actualResponse: any;

      service.resetPassword(data).subscribe((result) => {
        actualResponse = result;
      });

      const req = httpMock.expectOne(`${apiUrl}/reset-password`);

      req.flush(response);

      expect(actualResponse).toEqual(response);
    });

    it('should propagate reset-password errors', () => {
      const data = {
        email: 'john@smartcart.com',
        newPassword: 'Password1',
        confirmPassword: 'WrongPassword1',
      };

      let actualError: any;

      service.resetPassword(data).subscribe({
        error: (error) => {
          actualError = error;
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/reset-password`);

      req.flush(
        {
          message: 'Passwords do not match',
        },
        {
          status: 400,
          statusText: 'Bad Request',
        },
      );

      expect(actualError).toBeTruthy();

      expect(actualError.status).toBe(400);
    });
  });

  // =========================================================
  // AUTOMATIC JWT LOGOUT
  // =========================================================

  describe('automatic JWT expiration', () => {
    it('should logout immediately when JWT is already expired', () => {
      const expiredToken = createExpiredJwt();

      service
        .login({
          email: 'john@smartcart.com',
          password: 'Password1',
        })
        .subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);

      req.flush({
        ...customerLoginResponse,
        token: expiredToken,
      });

      expect(localStorage.getItem('token')).toBeNull();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should automatically logout when JWT expires', () => {
      const shortLivedToken = createJwt(5);

      service
        .login({
          email: 'john@smartcart.com',
          password: 'Password1',
        })
        .subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);

      req.flush({
        ...customerLoginResponse,
        token: shortLivedToken,
      });

      expect(localStorage.getItem('token')).toBe(shortLivedToken);

      vi.advanceTimersByTime(4_000);

      expect(localStorage.getItem('token')).toBe(shortLivedToken);

      vi.advanceTimersByTime(2_000);

      expect(localStorage.getItem('token')).toBeNull();

      expect(localStorage.getItem('username')).toBeNull();

      expect(localStorage.getItem('email')).toBeNull();

      expect(localStorage.getItem('role')).toBeNull();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should cancel the previous logout timer when logging in again', () => {
      const firstToken = createJwt(5);

      const secondToken = createJwt(20);

      service
        .login({
          email: 'first@smartcart.com',
          password: 'Password1',
        })
        .subscribe();

      let req = httpMock.expectOne(`${apiUrl}/login`);

      req.flush({
        ...customerLoginResponse,
        token: firstToken,
      });

      vi.advanceTimersByTime(2_000);

      service
        .login({
          email: 'second@smartcart.com',
          password: 'Password1',
        })
        .subscribe();

      req = httpMock.expectOne(`${apiUrl}/login`);

      req.flush({
        ...customerLoginResponse,
        token: secondToken,
        email: 'second@smartcart.com',
      });

      vi.advanceTimersByTime(4_000);

      expect(localStorage.getItem('token')).toBe(secondToken);

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should not start a timer when JWT has no expiration', () => {
      const header = btoa(
        JSON.stringify({
          alg: 'HS256',
          typ: 'JWT',
        }),
      );

      const payload = btoa(
        JSON.stringify({
          sub: '1',
        }),
      );

      const token = `${header}.${payload}.signature`;

      service
        .login({
          email: 'john@smartcart.com',
          password: 'Password1',
        })
        .subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);

      req.flush({
        ...customerLoginResponse,
        token,
      });

      expect(localStorage.getItem('token')).toBe(token);

      vi.advanceTimersByTime(60_000);

      expect(localStorage.getItem('token')).toBe(token);

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should logout when JWT cannot be decoded', () => {
      const invalidToken = 'invalid-token';

      service
        .login({
          email: 'john@smartcart.com',
          password: 'Password1',
        })
        .subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);

      req.flush({
        ...customerLoginResponse,
        token: invalidToken,
      });

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  // =========================================================
  // LOGOUT
  // =========================================================

  describe('logout', () => {
    it('should clear all authentication data', () => {
      localStorage.setItem('token', customerToken);

      localStorage.setItem('user', '{"id":1}');

      localStorage.setItem('username', 'john');

      localStorage.setItem('email', 'john@smartcart.com');

      localStorage.setItem('role', 'CUSTOMER');

      localStorage.setItem('pendingSignupUserId', '1');

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();

      expect(localStorage.getItem('user')).toBeNull();

      expect(localStorage.getItem('username')).toBeNull();

      expect(localStorage.getItem('email')).toBeNull();

      expect(localStorage.getItem('role')).toBeNull();

      expect(localStorage.getItem('pendingSignupUserId')).toBeNull();
    });

    it('should cancel the automatic logout timer', () => {
      const token = createJwt(10);

      service
        .login({
          email: 'john@smartcart.com',
          password: 'Password1',
        })
        .subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);

      req.flush({
        ...customerLoginResponse,
        token,
      });

      service.logout();

      vi.advanceTimersByTime(20_000);

      expect(localStorage.getItem('token')).toBeNull();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  // =========================================================
  // CLEAR SESSION
  // =========================================================

  describe('clearSession', () => {
    it('should clear token username email and role', () => {
      localStorage.setItem('token', customerToken);

      localStorage.setItem('username', 'john');

      localStorage.setItem('email', 'john@smartcart.com');

      localStorage.setItem('role', 'CUSTOMER');

      service.clearSession();

      expect(localStorage.getItem('token')).toBeNull();

      expect(localStorage.getItem('username')).toBeNull();

      expect(localStorage.getItem('email')).toBeNull();

      expect(localStorage.getItem('role')).toBeNull();
    });

    it('should not clear unrelated local storage values', () => {
      localStorage.setItem('user', '{"id":1}');

      service.clearSession();

      expect(localStorage.getItem('user')).toBe('{"id":1}');
    });
  });

  // =========================================================
  // IS LOGGED IN
  // =========================================================

  describe('isLoggedIn', () => {
    it('should return false when no token exists', () => {
      localStorage.removeItem('token');

      expect(service.isLoggedIn()).toBe(false);
    });

    it('should return true when token exists and is not expired', () => {
      const token = createJwt(300);

      localStorage.setItem('token', token);

      expect(service.isLoggedIn()).toBe(true);
    });

    it('should return false when token is expired', () => {
      const token = createExpiredJwt();

      localStorage.setItem('token', token);

      localStorage.setItem('username', 'john');

      expect(service.isLoggedIn()).toBe(false);

      expect(localStorage.getItem('token')).toBeNull();

      expect(localStorage.getItem('username')).toBeNull();
    });

    it('should return false when JWT has no expiration', () => {
      const header = btoa(
        JSON.stringify({
          alg: 'HS256',
          typ: 'JWT',
        }),
      );

      const payload = btoa(
        JSON.stringify({
          sub: '1',
        }),
      );

      const token = `${header}.${payload}.signature`;

      localStorage.setItem('token', token);

      expect(service.isLoggedIn()).toBe(false);
    });

    it('should return false and logout when JWT is invalid', () => {
      localStorage.setItem('token', 'not-a-valid-jwt');

      localStorage.setItem('username', 'john');

      expect(service.isLoggedIn()).toBe(false);

      expect(localStorage.getItem('token')).toBeNull();

      expect(localStorage.getItem('username')).toBeNull();
    });
  });

  // =========================================================
  // GET USERNAME
  // =========================================================

  describe('getUsername', () => {
    it('should return the stored username', () => {
      localStorage.setItem('username', 'john');

      expect(service.getUsername()).toBe('john');
    });

    it('should return empty string when username does not exist', () => {
      localStorage.removeItem('username');

      expect(service.getUsername()).toBe('');
    });
  });

  // =========================================================
  // GET EMAIL
  // =========================================================

  describe('getEmail', () => {
    it('should return the stored email', () => {
      localStorage.setItem('email', 'john@smartcart.com');

      expect(service.getEmail()).toBe('john@smartcart.com');
    });

    it('should return empty string when email does not exist', () => {
      localStorage.removeItem('email');

      expect(service.getEmail()).toBe('');
    });
  });

  // =========================================================
  // GET ROLE
  // =========================================================

  describe('getRole', () => {
    it('should return the stored role', () => {
      localStorage.setItem('role', 'CUSTOMER');

      expect(service.getRole()).toBe('CUSTOMER');
    });

    it('should return empty string when role does not exist', () => {
      localStorage.removeItem('role');

      expect(service.getRole()).toBe('');
    });
  });

  // =========================================================
  // MERCHANT REGISTER
  // =========================================================

  describe('registerMerchant', () => {
    it('should register a merchant', () => {
      const request = {
        username: 'merchant01',
        email: 'merchant@example.com',
        password: 'Password1',
      };

      const response = {
        token: createJwt(300),
        userId: 2,
        username: 'merchant01',
        email: 'merchant@example.com',
        role: 'MERCHANT',
      };

      let actualResponse: any;

      service.registerMerchant(request).subscribe((result) => {
        actualResponse = result;
      });

      const req = httpMock.expectOne(`${apiUrl}/merchant/register`);

      expect(req.request.method).toBe('POST');

      expect(req.request.body).toEqual(request);

      req.flush(response);

      expect(actualResponse).toEqual(response);
    });

    it('should propagate merchant registration errors', () => {
      const request = {
        username: 'merchant01',
        email: 'merchant@example.com',
        password: 'Password1',
      };

      let actualError: any;

      service.registerMerchant(request).subscribe({
        error: (error) => {
          actualError = error;
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/merchant/register`);

      req.flush(
        {
          message: 'Email already exists',
        },
        {
          status: 400,
          statusText: 'Bad Request',
        },
      );

      expect(actualError).toBeTruthy();

      expect(actualError.status).toBe(400);
    });
  });

  // =========================================================
  // MERCHANT PROFILE
  // =========================================================

  describe('createMerchantProfile', () => {
    // =======================================================
    // WITH LOGO
    // =======================================================

    it('should create merchant profile with logo and registration document', () => {
      const logoFile = new File(['fake-logo'], 'logo.png', {
        type: 'image/png',
      });

      const registrationDocument = new File(['fake-document'], 'registration.pdf', {
        type: 'application/pdf',
      });

      const data: MerchantProfileData = {
        userId: 2,
        businessName: 'SmartCart Fashion',
        uen: '202612345A',
        businessType: 'Retail',
        businessAddress: '10 Orchard Road',
        postalCode: '238840',
        contactNumber: '91234567',
        productCategory: 'Fashion',
        businessDescription: 'Fashion products',
        pickupAvailable: true,
        logoFile,
        registrationDocument,
      };

      service.createMerchantProfile(data).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/merchant/profile`);

      expect(req.request.method).toBe('POST');

      expect(req.request.body).toBeInstanceOf(FormData);

      const formData = req.request.body as FormData;

      // =================================================
      // TEXT FIELDS
      // =================================================

      expect(formData.get('userId')).toBe('2');

      expect(formData.get('businessName')).toBe('SmartCart Fashion');

      expect(formData.get('uen')).toBe('202612345A');

      expect(formData.get('businessType')).toBe('Retail');

      expect(formData.get('businessAddress')).toBe('10 Orchard Road');

      expect(formData.get('postalCode')).toBe('238840');

      expect(formData.get('contactNumber')).toBe('91234567');

      expect(formData.get('productCategory')).toBe('Fashion');

      expect(formData.get('businessDescription')).toBe('Fashion products');

      expect(formData.get('pickupAvailable')).toBe('true');

      // =================================================
      // LOGO
      // =================================================

      const uploadedLogo = formData.get('logo') as File;

      expect(uploadedLogo).toBeTruthy();

      expect(uploadedLogo.name).toBe('logo.png');

      expect(uploadedLogo.type).toBe('image/png');

      expect(uploadedLogo.size).toBe(logoFile.size);

      // =================================================
      // REGISTRATION DOCUMENT
      // =================================================

      const uploadedRegistrationDocument = formData.get('registrationDocument') as File;

      expect(uploadedRegistrationDocument).toBeTruthy();

      expect(uploadedRegistrationDocument.name).toBe('registration.pdf');

      expect(uploadedRegistrationDocument.type).toBe('application/pdf');

      expect(uploadedRegistrationDocument.size).toBe(registrationDocument.size);

      req.flush({
        message: 'Merchant profile created',
      });
    });

    // =======================================================
    // WITHOUT LOGO
    // =======================================================

    it('should create merchant profile without logo', () => {
      const registrationDocument = new File(['fake-document'], 'registration.pdf', {
        type: 'application/pdf',
      });

      const data: MerchantProfileData = {
        userId: 2,
        businessName: 'SmartCart Fashion',
        uen: '202612345A',
        businessType: 'Retail',
        businessAddress: '10 Orchard Road',
        postalCode: '238840',
        contactNumber: '91234567',
        productCategory: 'Fashion',
        businessDescription: 'Fashion products',
        pickupAvailable: false,
        logoFile: null,
        registrationDocument,
      };

      service.createMerchantProfile(data).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/merchant/profile`);

      expect(req.request.method).toBe('POST');

      expect(req.request.body).toBeInstanceOf(FormData);

      const formData = req.request.body as FormData;

      // =================================================
      // TEXT FIELDS
      // =================================================

      expect(formData.get('userId')).toBe('2');

      expect(formData.get('businessName')).toBe('SmartCart Fashion');

      expect(formData.get('uen')).toBe('202612345A');

      expect(formData.get('businessType')).toBe('Retail');

      expect(formData.get('businessAddress')).toBe('10 Orchard Road');

      expect(formData.get('postalCode')).toBe('238840');

      expect(formData.get('contactNumber')).toBe('91234567');

      expect(formData.get('productCategory')).toBe('Fashion');

      expect(formData.get('businessDescription')).toBe('Fashion products');

      expect(formData.get('pickupAvailable')).toBe('false');

      // =================================================
      // LOGO MUST NOT EXIST
      // =================================================

      expect(formData.get('logo')).toBeNull();

      // =================================================
      // REGISTRATION DOCUMENT
      // =================================================

      const uploadedRegistrationDocument = formData.get('registrationDocument') as File;

      expect(uploadedRegistrationDocument).toBeTruthy();

      expect(uploadedRegistrationDocument.name).toBe('registration.pdf');

      expect(uploadedRegistrationDocument.type).toBe('application/pdf');

      expect(uploadedRegistrationDocument.size).toBe(registrationDocument.size);

      req.flush({
        message: 'Merchant profile created',
      });
    });

    // =======================================================
    // ERROR
    // =======================================================

    it('should propagate merchant profile errors', () => {
      const registrationDocument = new File(['fake-document'], 'registration.pdf', {
        type: 'application/pdf',
      });

      const data: MerchantProfileData = {
        userId: 2,
        businessName: 'SmartCart Fashion',
        uen: '202612345A',
        businessType: 'Retail',
        businessAddress: '10 Orchard Road',
        postalCode: '238840',
        contactNumber: '91234567',
        productCategory: 'Fashion',
        businessDescription: 'Fashion products',
        pickupAvailable: true,
        logoFile: null,
        registrationDocument,
      };

      let actualError: any;

      service.createMerchantProfile(data).subscribe({
        error: (error) => {
          actualError = error;
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/merchant/profile`);

      expect(req.request.method).toBe('POST');

      req.flush(
        {
          message: 'Unable to create merchant profile',
        },
        {
          status: 400,
          statusText: 'Bad Request',
        },
      );

      expect(actualError).toBeTruthy();

      expect(actualError.status).toBe(400);
    });
  });
});
