import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { Login } from './login';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

//Author: Junior

describe('Login', () => {
  let component: Login;

  let authServiceMock: {
    login: ReturnType<typeof vi.fn>;
  };

  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  let cdrMock: {
    detectChanges: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authServiceMock = {
      login: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    cdrMock = {
      detectChanges: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },

        {
          provide: Router,
          useValue: routerMock,
        },

        {
          provide: ChangeDetectorRef,
          useValue: cdrMock,
        },
      ],
    });

    component = TestBed.runInInjectionContext(() => {
      return new Login();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================
  // BASIC TESTS
  // =========================================================

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty email', () => {
    expect(component.email).toBe('');
  });

  it('should have empty password', () => {
    expect(component.password).toBe('');
  });

  it('should have password hidden', () => {
    expect(component.showPassword).toBe(false);
  });

  it('should have loading false', () => {
    expect(component.loading).toBe(false);
  });

  it('should have empty error', () => {
    expect(component.error).toBe('');
  });

  // =========================================================
  // VALIDATION
  // =========================================================

  it('should display error when email is empty', () => {
    component.email = '';
    component.password = 'Password123';

    component.login();

    expect(component.error).toBe('Please enter your email.');

    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('should display error when email contains only spaces', () => {
    component.email = '   ';
    component.password = 'Password123';

    component.login();

    expect(component.error).toBe('Please enter your email.');

    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('should display error when password is empty', () => {
    component.email = 'john@smartcart.com';
    component.password = '';

    component.login();

    expect(component.error).toBe('Please enter your password.');

    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  // =========================================================
  // CUSTOMER LOGIN
  // =========================================================

  it('should login successfully as CUSTOMER', () => {
    const response = {
      token: 'customer-jwt-token',
      userId: 1,
      username: 'john',
      email: 'john@smartcart.com',
      role: 'CUSTOMER',
    };

    authServiceMock.login.mockReturnValue(of(response));

    component.email = 'john@smartcart.com';

    component.password = 'Password123';

    component.login();

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'john@smartcart.com',

      password: 'Password123',
    });

    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });

  // =========================================================
  // TRIM EMAIL
  // =========================================================

  it('should trim email before login', () => {
    const response = {
      token: 'customer-jwt-token',
      userId: 1,
      username: 'john',
      email: 'john@smartcart.com',
      role: 'CUSTOMER',
    };

    authServiceMock.login.mockReturnValue(of(response));

    component.email = '   john@smartcart.com   ';

    component.password = 'Password123';

    component.login();

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'john@smartcart.com',

      password: 'Password123',
    });
  });

  // =========================================================
  // MERCHANT LOGIN
  // =========================================================

  it('should login successfully as MERCHANT', () => {
    const response = {
      token: 'merchant-jwt-token',
      userId: 2,
      username: 'merchant01',
      email: 'merchant@example.com',
      role: 'MERCHANT',
    };

    authServiceMock.login.mockReturnValue(of(response));

    component.email = 'merchant@example.com';

    component.password = 'Password123';

    component.login();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/merchant']);
  });

  // =========================================================
  // UNKNOWN ROLE
  // =========================================================

  it('should display invalid user role error', () => {
    const response = {
      token: 'test-token',
      userId: 3,
      username: 'testuser',
      email: 'test@example.com',
      role: 'ADMIN',
    };

    authServiceMock.login.mockReturnValue(of(response));

    component.email = 'test@example.com';

    component.password = 'Password123';

    component.login();

    expect(component.error).toBe('Invalid user role.');

    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  // =========================================================
  // 401 ERROR
  // =========================================================

  it('should display invalid email or password for 401 error', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({
        status: 401,
      })),
    );

    component.email = 'wrong@smartcart.com';

    component.password = 'WrongPassword';

    component.login();

    expect(component.error).toBe('Invalid email or password.');
  });

  // =========================================================
  // BACKEND ERROR MESSAGE
  // =========================================================

  it('should display backend error message', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({
        status: 500,

        error: {
          message: 'Account is inactive',
        },
      })),
    );

    component.email = 'john@smartcart.com';

    component.password = 'Password123';

    component.login();

    expect(component.error).toBe('Account is inactive');
  });

  // =========================================================
  // GENERIC ERROR
  // =========================================================

  it('should display generic error when backend does not provide a message', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({
        status: 500,

        error: {},
      })),
    );

    component.email = 'john@smartcart.com';

    component.password = 'Password123';

    component.login();

    expect(component.error).toBe('Unable to login. Please try again.');
  });

  // =========================================================
  // LOADING - SUCCESS
  // =========================================================

  it('should set loading to false after successful login', () => {
    const response = {
      token: 'customer-token',
      userId: 1,
      username: 'john',
      email: 'john@smartcart.com',
      role: 'CUSTOMER',
    };

    authServiceMock.login.mockReturnValue(of(response));

    component.email = 'john@smartcart.com';

    component.password = 'Password123';

    component.login();

    expect(component.loading).toBe(false);
  });

  // =========================================================
  // LOADING - ERROR
  // =========================================================

  it('should set loading to false after login failure', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({
        status: 401,
      })),
    );

    component.email = 'wrong@smartcart.com';

    component.password = 'WrongPassword';

    component.login();

    expect(component.loading).toBe(false);
  });

  // =========================================================
  // PASSWORD TOGGLE
  // =========================================================

  it('should show password when toggled', () => {
    expect(component.showPassword).toBe(false);

    component.togglePassword();

    expect(component.showPassword).toBe(true);
  });

  it('should hide password when toggled twice', () => {
    component.togglePassword();

    component.togglePassword();

    expect(component.showPassword).toBe(false);
  });
});
