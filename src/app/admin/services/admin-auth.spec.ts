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

  describe('logout', () => {
    it('clears the stored session and sets isLoggedIn to false', () => {
      service.login('admin@smartcart.com', 'secret').subscribe();
      httpTestingController.expectOne(`${environment.apiUrl}/auth/login`).flush(adminResponse);

      service.logout();

      expect(service.isLoggedIn()).toBe(false);
      expect(sessionStorage.getItem('smartcart_admin_token')).toBeNull();
      expect(sessionStorage.getItem('smartcart_admin_role')).toBeNull();
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
