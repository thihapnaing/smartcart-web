import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AuthService } from './auth.service';
import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8080/api/auth';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear browser storage before each test so leftover data from one
    // test cannot accidentally affect the next test
    localStorage.clear();
  });

  afterEach(() => {
    // Confirms that no requests were made that the test did not expect
    httpMock.verify();
  });

  describe('login', () => {
    it('sends a POST request to the login endpoint with the given credentials', () => {
      const fakeRequest: LoginRequest = {
        email: 'shannon@example.com',
        password: 'password123',
      } as LoginRequest;

      service.login(fakeRequest).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(fakeRequest);

      // Provide a fake server response so the request finishes
      req.flush({
        token: 'fake-token',
        username: 'shannon',
        email: 'shannon@example.com',
        role: 'CUSTOMER',
      } as LoginResponse);
    });

    it('stores the token, username, email and role in local storage on a successful login', () => {
      const fakeRequest: LoginRequest = {
        email: 'shannon@example.com',
        password: 'password123',
      } as LoginRequest;

      const fakeResponse: LoginResponse = {
        token: 'fake-token',
        username: 'shannon',
        email: 'shannon@example.com',
        role: 'CUSTOMER',
      } as LoginResponse;

      service.login(fakeRequest).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(fakeResponse);

      expect(localStorage.getItem('token')).toBe('fake-token');
      expect(localStorage.getItem('username')).toBe('shannon');
      expect(localStorage.getItem('email')).toBe('shannon@example.com');
      expect(localStorage.getItem('role')).toBe('CUSTOMER');
    });
  });

  describe('register', () => {
    it('sends a POST request to the register endpoint with the given details', () => {
      const registrationData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      service.register(registrationData).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registrationData);

      req.flush({ success: true });
    });
  });

  describe('logout', () => {
    it('removes token, user, username, email and role from local storage', () => {
      // Fill storage with fake values first, so removal can actually be checked
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', 'fake-user');
      localStorage.setItem('username', 'shannon');
      localStorage.setItem('email', 'shannon@example.com');
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
    it('removes token, username, email and role from local storage', () => {
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('username', 'shannon');
      localStorage.setItem('email', 'shannon@example.com');
      localStorage.setItem('role', 'CUSTOMER');

      service.clearSession();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(localStorage.getItem('email')).toBeNull();
      expect(localStorage.getItem('role')).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('returns true when a token exists in local storage', () => {
      localStorage.setItem('token', 'fake-token');
      expect(service.isLoggedIn()).toBe(true);
    });

    it('returns false when no token exists in local storage', () => {
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('getUsername', () => {
    it('returns the stored username when one exists', () => {
      localStorage.setItem('username', 'shannon');
      expect(service.getUsername()).toBe('shannon');
    });

    it('returns an empty string when no username is stored', () => {
      expect(service.getUsername()).toBe('');
    });
  });

  describe('getEmail', () => {
    it('returns the stored email when one exists', () => {
      localStorage.setItem('email', 'shannon@example.com');
      expect(service.getEmail()).toBe('shannon@example.com');
    });

    it('returns an empty string when no email is stored', () => {
      expect(service.getEmail()).toBe('');
    });
  });

  describe('getRole', () => {
    it('returns the stored role when one exists', () => {
      localStorage.setItem('role', 'CUSTOMER');
      expect(service.getRole()).toBe('CUSTOMER');
    });

    it('returns an empty string when no role is stored', () => {
      expect(service.getRole()).toBe('');
    });
  });
});