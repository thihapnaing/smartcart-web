import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminAuthService } from './admin-auth';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../../models/login-response';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let httpTestingController: HttpTestingController;

  const adminResponse: LoginResponse = {
    token: 'fake.jwt.token',
    userId: 4,
    username: 'admin',
    email: 'admin@smartcart.com',
    role: 'ADMIN',
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminAuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    sessionStorage.clear();
  });

  it('starts logged out when there is no stored session', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('starts with no username when there is no stored session', () => {
    expect(service.username()).toBeNull();
  });

  it('picks up a stored username from sessionStorage on construction', () => {
    sessionStorage.setItem('smartcart_admin_username', 'grace_admin');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const freshService = TestBed.inject(AdminAuthService);

    expect(freshService.username()).toBe('grace_admin');
  });

  it('picks up an existing ADMIN session from sessionStorage on construction', () => {
    sessionStorage.setItem('smartcart_admin_token', 'fake.jwt.token');
    sessionStorage.setItem('smartcart_admin_role', 'ADMIN');

    // The signal reads sessionStorage in the field initializer, so a fresh instance is needed -
    // the one injected in beforeEach was already constructed before these flags were set.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const freshService = TestBed.inject(AdminAuthService);

    expect(freshService.isLoggedIn()).toBe(true);
  });

  it('does not treat a stored non-ADMIN role as logged in', () => {
    sessionStorage.setItem('smartcart_admin_token', 'fake.jwt.token');
    sessionStorage.setItem('smartcart_admin_role', 'CUSTOMER');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const freshService = TestBed.inject(AdminAuthService);

    expect(freshService.isLoggedIn()).toBe(false);
  });

  describe('login', () => {
    it('posts credentials to /auth/login and returns the response', () => {
      let actual: LoginResponse | undefined;

      service.login('admin@smartcart.com', 'secret').subscribe((res) => (actual = res));

      const request = httpTestingController.expectOne(`${environment.apiUrl}/auth/login`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ email: 'admin@smartcart.com', password: 'secret' });

      request.flush(adminResponse);

      expect(actual).toEqual(adminResponse);
    });

    it('stores the token/role and marks the session as logged in for an ADMIN response', () => {
      service.login('admin@smartcart.com', 'secret').subscribe();

      httpTestingController.expectOne(`${environment.apiUrl}/auth/login`).flush(adminResponse);

      expect(service.isLoggedIn()).toBe(true);
      expect(sessionStorage.getItem('smartcart_admin_token')).toBe('fake.jwt.token');
      expect(sessionStorage.getItem('smartcart_admin_role')).toBe('ADMIN');
      expect(sessionStorage.getItem('smartcart_admin_username')).toBe('admin');
      expect(service.username()).toBe('admin');
    });

    it('stores the token/role but does not mark the session as logged in for a non-ADMIN response', () => {
      service.login('customer@smartcart.com', 'secret').subscribe();

      httpTestingController
        .expectOne(`${environment.apiUrl}/auth/login`)
        .flush({ ...adminResponse, role: 'CUSTOMER' });

      expect(service.isLoggedIn()).toBe(false);
      expect(sessionStorage.getItem('smartcart_admin_role')).toBe('CUSTOMER');
    });

    it('propagates an error response without changing the session', () => {
      let error: unknown;

      service.login('admin@smartcart.com', 'wrong').subscribe({ error: (e) => (error = e) });

      httpTestingController
        .expectOne(`${environment.apiUrl}/auth/login`)
        .flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });

      expect(error).toBeTruthy();
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('posts to /auth/change-password with an explicit Authorization header using the admin token', () => {
      service.login('admin@smartcart.com', 'secret').subscribe();
      httpTestingController.expectOne(`${environment.apiUrl}/auth/login`).flush(adminResponse);

      let actual: { message: string } | undefined;
      service.changePassword('newpassword123', 'newpassword123').subscribe((res) => (actual = res));

      const request = httpTestingController.expectOne(`${environment.apiUrl}/auth/change-password`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });
      expect(request.request.headers.get('Authorization')).toBe('Bearer fake.jwt.token');

      request.flush({ message: 'Password changed successfully' });

      expect(actual).toEqual({ message: 'Password changed successfully' });
    });

    it('propagates an error response', () => {
      let error: unknown;

      service.changePassword('newpassword123', 'somethingElse123').subscribe({ error: (e) => (error = e) });

      httpTestingController
        .expectOne(`${environment.apiUrl}/auth/change-password`)
        .flush('Passwords do not match', { status: 400, statusText: 'Bad Request' });

      expect(error).toBeTruthy();
    });
  });

  describe('logout', () => {
    it('clears the stored session and sets isLoggedIn to false', () => {
      service.login('admin@smartcart.com', 'secret').subscribe();
      httpTestingController.expectOne(`${environment.apiUrl}/auth/login`).flush(adminResponse);

      service.logout();

      expect(service.isLoggedIn()).toBe(false);
      expect(sessionStorage.getItem('smartcart_admin_token')).toBeNull();
      expect(sessionStorage.getItem('smartcart_admin_role')).toBeNull();
      expect(sessionStorage.getItem('smartcart_admin_username')).toBeNull();
      expect(service.username()).toBeNull();
    });
  });

  describe('getToken', () => {
    it('returns null when there is no stored token', () => {
      expect(service.getToken()).toBeNull();
    });

    it('returns the stored token after a successful login', () => {
      service.login('admin@smartcart.com', 'secret').subscribe();
      httpTestingController.expectOne(`${environment.apiUrl}/auth/login`).flush(adminResponse);

      expect(service.getToken()).toBe('fake.jwt.token');
    });
  });
});
