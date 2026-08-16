import { TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';

import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';

import { environment } from '../../environments/environment';

//Author: Htet Nandar
//Updated: Junior

describe('AuthService', () => {
  let service: AuthService;

  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/auth`;

  // =======================================================
  // TEST RESPONSES
  // =======================================================

  const customerLoginResponse: LoginResponse = {
    token: 'customer-jwt-token',

    userId: 1,

    username: 'john',

    email: 'john@smartcart.com',

    role: 'CUSTOMER',
  };

  const merchantLoginResponse: LoginResponse = {
    token: 'merchant-jwt-token',

    userId: 2,

    username: 'merchant01',

    email: 'merchant@example.com',

    role: 'MERCHANT',
  };

  // =======================================================
  // BEFORE EACH
  // =======================================================

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);

    httpMock = TestBed.inject(HttpTestingController);
  });

  // =======================================================
  // AFTER EACH
  // =======================================================

  afterEach(() => {
    httpMock.verify();

    localStorage.clear();
  });

  // =======================================================
  // SERVICE
  // =======================================================

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // =========================================================
  // LOGIN
  // =========================================================

  describe('login', () => {
    // =======================================================
    // CUSTOMER LOGIN
    // =======================================================

    it('should login successfully as customer', () => {
      const request: LoginRequest = {
        email: 'john@smartcart.com',

        password: 'Password1',
      };

      let actualResponse: LoginResponse | undefined;

      service.login(request).subscribe((response) => {
        actualResponse = response;
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);

      expect(req.request.method).toBe('POST');

      expect(req.request.body).toEqual(request);

      req.flush(customerLoginResponse);

      expect(actualResponse).toEqual(customerLoginResponse);
    });

    // =======================================================
    // CUSTOMER LOGIN LOCAL STORAGE
    // =======================================================

    it('should store customer login information', () => {
      const request: LoginRequest = {
        email: 'john@smartcart.com',

        password: 'Password1',
      };

      service.login(request).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);

      req.flush(customerLoginResponse);

      expect(localStorage.getItem('token')).toBe('customer-jwt-token');

      expect(localStorage.getItem('username')).toBe('john');

      expect(localStorage.getItem('email')).toBe('john@smartcart.com');

      expect(localStorage.getItem('role')).toBe('CUSTOMER');
    });

    // =======================================================
    // MERCHANT LOGIN
    // =======================================================

    it('should login successfully as merchant', () => {
      const request: LoginRequest = {
        email: 'merchant@example.com',

        password: 'Password1',
      };

      let actualResponse: LoginResponse | undefined;

      service.login(request).subscribe((response) => {
        actualResponse = response;
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);

      expect(req.request.method).toBe('POST');

      expect(req.request.body).toEqual(request);

      req.flush(merchantLoginResponse);

      expect(actualResponse).toEqual(merchantLoginResponse);
    });

    // =======================================================
    // MERCHANT LOGIN LOCAL STORAGE
    // =======================================================

    it('should store merchant login information', () => {
      const request: LoginRequest = {
        email: 'merchant@example.com',

        password: 'Password1',
      };

      service.login(request).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);

      req.flush(merchantLoginResponse);

      expect(localStorage.getItem('token')).toBe('merchant-jwt-token');

      expect(localStorage.getItem('username')).toBe('merchant01');

      expect(localStorage.getItem('email')).toBe('merchant@example.com');

      expect(localStorage.getItem('role')).toBe('MERCHANT');
    });

    // =======================================================
    // LOGIN ERROR
    // =======================================================

    it('should propagate login error', () => {
      const request: LoginRequest = {
        email: 'wrong@example.com',

        password: 'wrongpassword',
      };

      let actualError: any = null;

      service.login(request).subscribe({
        next: (response) => {
          actualError = response;
        },

        error: (error) => {
          actualError = error;
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);

      expect(req.request.method).toBe('POST');

      req.flush(
        'Invalid email or password',

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
    // =======================================================
    // SUCCESS
    // =======================================================

    it('should register a customer', () => {
      const data = {
        username: 'john',

        email: 'john@example.com',

        password: 'Password1',
      };

      const response: LoginResponse = {
        token: 'customer-token',

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

    // =======================================================
    // ERROR
    // =======================================================

    it('should propagate customer registration error', () => {
      const data = {
        username: 'john',

        email: 'john@example.com',

        password: 'Password1',
      };

      let actualError: any = null;

      service.register(data).subscribe({
        next: (response) => {
          actualError = response;
        },

        error: (error) => {
          actualError = error;
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/register`);

      req.flush(
        'Email is already registered',

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
  // USER PROFILE WITH AVATAR
  // =========================================================

  describe('createUserProfileWithAvatar', () => {
    // =====================================================
    // WITH AVATAR
    // =====================================================

    it('should create user profile with avatar', () => {
      const avatarFile = new File(
        ['fake-avatar'],

        'avatar.jpg',

        {
          type: 'image/jpeg',
        },
      );

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

    // =====================================================
    // WITHOUT AVATAR
    // =====================================================

    it('should create user profile without avatar', () => {
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
  // USER PROFILE JSON
  // =========================================================

  describe('createUserProfile', () => {
    it('should create user profile', () => {
      const data = {
        userId: 1,

        firstName: 'John',

        lastName: 'Tan',

        address: '12 Rainbow Street',

        postalCode: '123456',

        phoneNumber: '91234567',

        avatarUrl: 'upload/John-avatar.jpg',
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
  // LOGOUT
  // =========================================================

  describe('logout', () => {
    it('should clear authentication information', () => {
      localStorage.setItem('token', 'fake.jwt.token');

      localStorage.setItem('user', '{"id":2}');

      localStorage.setItem('username', 'john');

      localStorage.setItem('email', 'john@smartcart.com');

      localStorage.setItem('role', 'CUSTOMER');

      localStorage.setItem('pendingSignupUserId', '2');

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();

      expect(localStorage.getItem('user')).toBeNull();

      expect(localStorage.getItem('username')).toBeNull();

      expect(localStorage.getItem('email')).toBeNull();

      expect(localStorage.getItem('role')).toBeNull();

      expect(localStorage.getItem('pendingSignupUserId')).toBeNull();
    });
  });

  // =========================================================
  // CLEAR SESSION
  // =========================================================

  describe('clearSession', () => {
    it('should clear token username email and role', () => {
      localStorage.setItem('token', 'fake.jwt.token');

      localStorage.setItem('username', 'john');

      localStorage.setItem('email', 'john@smartcart.com');

      localStorage.setItem('role', 'CUSTOMER');

      service.clearSession();

      expect(localStorage.getItem('token')).toBeNull();

      expect(localStorage.getItem('username')).toBeNull();

      expect(localStorage.getItem('email')).toBeNull();

      expect(localStorage.getItem('role')).toBeNull();
    });

    it('should not remove user key', () => {
      localStorage.setItem('user', '{"id":2}');

      service.clearSession();

      expect(localStorage.getItem('user')).toBe('{"id":2}');
    });
  });

  // =========================================================
  // IS LOGGED IN
  // =========================================================

  describe('isLoggedIn', () => {
    it('should return false when token does not exist', () => {
      localStorage.removeItem('token');

      expect(service.isLoggedIn()).toBe(false);
    });

    it('should return true when token exists', () => {
      localStorage.setItem('token', 'fake.jwt.token');

      expect(service.isLoggedIn()).toBe(true);
    });
  });

  // =========================================================
  // GET USERNAME
  // =========================================================

  describe('getUsername', () => {
    it('should return stored username', () => {
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
    it('should return stored email', () => {
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
    it('should return CUSTOMER role', () => {
      localStorage.setItem('role', 'CUSTOMER');

      expect(service.getRole()).toBe('CUSTOMER');
    });

    it('should return MERCHANT role', () => {
      localStorage.setItem('role', 'MERCHANT');

      expect(service.getRole()).toBe('MERCHANT');
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
    // =====================================================
    // SUCCESS
    // =====================================================

    it('should register a merchant', () => {
      const request = {
        username: 'merchant01',

        email: 'merchant@example.com',

        password: 'Password1',
      };

      const response = {
        token: 'merchant-token',

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

    // =====================================================
    // ERROR
    // =====================================================

    it('should propagate merchant registration error', () => {
      const request = {
        username: 'merchant01',

        email: 'merchant@example.com',

        password: 'Password1',
      };

      let actualError: any = null;

      service.registerMerchant(request).subscribe({
        next: (response) => {
          actualError = response;
        },

        error: (error) => {
          actualError = error;
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/merchant/register`);

      req.flush(
        'Email is already registered',

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
    // =====================================================
    // WITH LOGO + REGISTRATION DOCUMENT
    // =====================================================

    it('should create merchant profile with logo and registration document', () => {
      const logoFile = new File(
        ['fake-logo'],

        'logo.png',

        {
          type: 'image/png',
        },
      );

      const registrationDocument = new File(
        ['fake-document'],

        'registration.pdf',

        {
          type: 'application/pdf',
        },
      );

      service
        .createMerchantProfile(
          2,

          'SmartCart Fashion',

          '202612345A',

          'Retail',

          '10 Orchard Road',

          '238840',

          '91234567',

          'Fashion',

          'Fashion products',

          true,

          logoFile,

          registrationDocument,
        )
        .subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/merchant/profile`);

      expect(req.request.method).toBe('POST');

      expect(req.request.body).toBeInstanceOf(FormData);

      const formData = req.request.body as FormData;

      // -------------------------------------------------
      // TEXT FIELDS
      // -------------------------------------------------

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

      // -------------------------------------------------
      // LOGO
      // -------------------------------------------------

      const uploadedLogo = formData.get('logo') as File;

      expect(uploadedLogo).toBeTruthy();

      expect(uploadedLogo.name).toBe('logo.png');

      expect(uploadedLogo.type).toBe('image/png');

      expect(uploadedLogo.size).toBe(logoFile.size);

      // -------------------------------------------------
      // REGISTRATION DOCUMENT
      // -------------------------------------------------

      const uploadedRegistrationDocument = formData.get('registrationDocument') as File;

      expect(uploadedRegistrationDocument).toBeTruthy();

      expect(uploadedRegistrationDocument.name).toBe('registration.pdf');

      expect(uploadedRegistrationDocument.type).toBe('application/pdf');

      expect(uploadedRegistrationDocument.size).toBe(registrationDocument.size);

      req.flush({
        message: 'Merchant profile created',
      });
    });

    // =====================================================
    // WITHOUT LOGO
    // =====================================================

    it('should create merchant profile without logo', () => {
      const registrationDocument = new File(
        ['fake-document'],

        'registration.pdf',

        {
          type: 'application/pdf',
        },
      );

      service
        .createMerchantProfile(
          2,

          'SmartCart Fashion',

          '202612345A',

          'Retail',

          '10 Orchard Road',

          '238840',

          '91234567',

          'Fashion',

          'Fashion products',

          false,

          null,

          registrationDocument,
        )
        .subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/merchant/profile`);

      expect(req.request.method).toBe('POST');

      expect(req.request.body).toBeInstanceOf(FormData);

      const formData = req.request.body as FormData;

      // -------------------------------------------------
      // TEXT FIELDS
      // -------------------------------------------------

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

      // -------------------------------------------------
      // LOGO SHOULD NOT EXIST
      // -------------------------------------------------

      expect(formData.get('logo')).toBeNull();

      // -------------------------------------------------
      // REGISTRATION DOCUMENT
      // -------------------------------------------------

      const uploadedRegistrationDocument = formData.get('registrationDocument') as File;

      expect(uploadedRegistrationDocument).toBeTruthy();

      expect(uploadedRegistrationDocument.name).toBe('registration.pdf');

      expect(uploadedRegistrationDocument.type).toBe('application/pdf');

      expect(uploadedRegistrationDocument.size).toBe(registrationDocument.size);

      req.flush({
        message: 'Merchant profile created',
      });
    });
  });
});
