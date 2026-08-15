import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { LoginResponse } from '../models/login-response';

// AUTHOR: Htet Nandar(Grace)
describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;

  const loginResponse: LoginResponse = {
    token: 'fake.jwt.token',
    userId: 2,
    username: 'grace',
    email: 'grace@smartcart.com',
    role: 'CUSTOMER',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  describe('login', () => {
    it('posts credentials to /auth/login and returns the response', () => {
      let actual: LoginResponse | undefined;

      service.login({ email: 'grace@smartcart.com', password: 'secret' }).subscribe((res) => (actual = res));

      const request = httpTestingController.expectOne(`${environment.apiUrl}/auth/login`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ email: 'grace@smartcart.com', password: 'secret' });

      request.flush(loginResponse);

      expect(actual).toEqual(loginResponse);
    });

    it('stores token/username/email/role in localStorage on success', () => {
      service.login({ email: 'grace@smartcart.com', password: 'secret' }).subscribe();

      httpTestingController.expectOne(`${environment.apiUrl}/auth/login`).flush(loginResponse);

      expect(localStorage.getItem('token')).toBe('fake.jwt.token');
      expect(localStorage.getItem('username')).toBe('grace');
      expect(localStorage.getItem('email')).toBe('grace@smartcart.com');
      expect(localStorage.getItem('role')).toBe('CUSTOMER');
    });

    it('propagates an error response without writing anything to localStorage', () => {
      let error: unknown;

      service.login({ email: 'grace@smartcart.com', password: 'wrong' }).subscribe({ error: (e) => (error = e) });

      httpTestingController
        .expectOne(`${environment.apiUrl}/auth/login`)
        .flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });

      expect(error).toBeTruthy();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('register', () => {
    it('posts the signup payload to /auth/register', () => {
      const payload = { username: 'grace', email: 'grace@smartcart.com', password: 'secret1' };

      service.register(payload).subscribe();

      const request = httpTestingController.expectOne(`${environment.apiUrl}/auth/register`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(payload);

      request.flush(loginResponse);
    });
  });

  describe('logout', () => {
    it('clears token, user, username, email, and role from localStorage', () => {
      localStorage.setItem('token', 'fake.jwt.token');
      localStorage.setItem('user', '{"id":2}');
      localStorage.setItem('username', 'grace');
      localStorage.setItem('email', 'grace@smartcart.com');
      localStorage.setItem('role', 'CUSTOMER');

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(localStorage.getItem('email')).toBeNull();
      expect(localStorage.getItem('role')).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('clears token/username/email/role but leaves the "user" key untouched', () => {
      // Unlike logout(), clearSession() intentionally doesn't remove "user" - see the service:
      // it clears one fewer key. This test locks in that difference.
      localStorage.setItem('token', 'fake.jwt.token');
      localStorage.setItem('username', 'grace');
      localStorage.setItem('email', 'grace@smartcart.com');
      localStorage.setItem('role', 'CUSTOMER');
      localStorage.setItem('user', '{"id":2}');

      service.clearSession();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(localStorage.getItem('email')).toBeNull();
      expect(localStorage.getItem('role')).toBeNull();
      expect(localStorage.getItem('user')).toBe('{"id":2}');
    });
  });

  describe('isLoggedIn', () => {
    it('is false when there is no token', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('is true once a token is stored', () => {
      localStorage.setItem('token', 'fake.jwt.token');

      expect(service.isLoggedIn()).toBe(true);
    });
  });

  describe('getUsername / getEmail / getRole', () => {
    it('return the stored values', () => {
      localStorage.setItem('username', 'grace');
      localStorage.setItem('email', 'grace@smartcart.com');
      localStorage.setItem('role', 'CUSTOMER');

      expect(service.getUsername()).toBe('grace');
      expect(service.getEmail()).toBe('grace@smartcart.com');
      expect(service.getRole()).toBe('CUSTOMER');
    });

    it('return an empty string when nothing is stored', () => {
      expect(service.getUsername()).toBe('');
      expect(service.getEmail()).toBe('');
      expect(service.getRole()).toBe('');
    });
  });
});
