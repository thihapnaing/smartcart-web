import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Login } from './login';
import { AuthService } from '../../services/auth.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  let authService: {
    login: ReturnType<typeof vi.fn>;
  };

  let router: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = {
      login: vi.fn(),
    };

    router = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  // ==========================================================
  // COMPONENT INITIALIZATION
  // ==========================================================

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

  // ==========================================================
  // VALIDATION
  // ==========================================================

  it('should display error when email is empty', () => {
    component.email = '';
    component.password = 'Password1';

    component.login();

    expect(component.error).toBe('Please enter your email.');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should display error when email contains only spaces', () => {
    component.email = '   ';
    component.password = 'Password1';

    component.login();

    expect(component.error).toBe('Please enter your email.');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should display error when password is empty', () => {
    component.email = 'junior@example.com';
    component.password = '';

    component.login();

    expect(component.error).toBe('Please enter your password.');
    expect(authService.login).not.toHaveBeenCalled();
  });

  // ==========================================================
  // CUSTOMER LOGIN
  // ==========================================================

  it('should login successfully as CUSTOMER', () => {
    const response = {
      token: 'customer-token',
      username: 'Junior',
      email: 'junior@example.com',
      role: 'CUSTOMER',
    };

    authService.login.mockReturnValue(of(response));

    component.email = 'junior@example.com';
    component.password = 'Password1';

    component.login();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'junior@example.com',
      password: 'Password1',
    });

    expect(component.loading).toBe(false);
    expect(component.error).toBe('');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  // ==========================================================
  // TRIM EMAIL
  // ==========================================================

  it('should trim email before login', () => {
    const response = {
      token: 'customer-token',
      username: 'Junior',
      email: 'junior@example.com',
      role: 'CUSTOMER',
    };

    authService.login.mockReturnValue(of(response));

    component.email = '  junior@example.com  ';
    component.password = 'Password1';

    component.login();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'junior@example.com',
      password: 'Password1',
    });

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  // ==========================================================
  // MERCHANT LOGIN
  // ==========================================================

  it('should login successfully as MERCHANT', () => {
    const response = {
      token: 'merchant-token',
      username: 'Merchant',
      email: 'merchant@example.com',
      role: 'MERCHANT',
    };

    authService.login.mockReturnValue(of(response));

    component.email = 'merchant@example.com';
    component.password = 'Password1';

    component.login();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'merchant@example.com',
      password: 'Password1',
    });

    expect(component.loading).toBe(false);
    expect(component.error).toBe('');
    expect(router.navigate).toHaveBeenCalledWith(['/merchant/products']);
  });

  // ==========================================================
  // INVALID ROLE
  // ==========================================================

  it('should display invalid user role error', () => {
    const response = {
      token: 'test-token',
      username: 'Junior',
      email: 'junior@example.com',
      role: 'ADMIN',
    };

    authService.login.mockReturnValue(of(response));

    component.email = 'junior@example.com';
    component.password = 'Password1';

    component.login();

    expect(component.loading).toBe(false);
    expect(component.error).toBe('Invalid user role.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  // ==========================================================
  // LOGIN ERRORS
  // ==========================================================

  it('should display invalid email or password for 401 error', () => {
    authService.login.mockReturnValue(
      throwError(() => ({
        status: 401,
      })),
    );

    component.email = 'junior@example.com';
    component.password = 'WrongPassword';

    component.login();

    expect(component.loading).toBe(false);
    expect(component.error).toBe('Invalid email or password.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should display backend error message', () => {
    authService.login.mockReturnValue(
      throwError(() => ({
        status: 500,
        error: {
          message: 'Account is inactive.',
        },
      })),
    );

    component.email = 'junior@example.com';
    component.password = 'Password1';

    component.login();

    expect(component.loading).toBe(false);
    expect(component.error).toBe('Account is inactive.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should display generic error when backend does not provide a message', () => {
    authService.login.mockReturnValue(
      throwError(() => ({
        status: 500,
        error: {},
      })),
    );

    component.email = 'junior@example.com';
    component.password = 'Password1';

    component.login();

    expect(component.loading).toBe(false);
    expect(component.error).toBe('Unable to login. Please try again.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  it('should set loading to false after successful login', () => {
    const response = {
      token: 'customer-token',
      username: 'Junior',
      email: 'junior@example.com',
      role: 'CUSTOMER',
    };

    authService.login.mockReturnValue(of(response));

    component.email = 'junior@example.com';
    component.password = 'Password1';

    component.login();

    expect(component.loading).toBe(false);
  });

  it('should set loading to false after login failure', () => {
    authService.login.mockReturnValue(
      throwError(() => ({
        status: 500,
        error: {},
      })),
    );

    component.email = 'junior@example.com';
    component.password = 'Password1';

    component.login();

    expect(component.loading).toBe(false);
  });

  // ==========================================================
  // PASSWORD VISIBILITY
  // ==========================================================

  it('should show password when toggled', () => {
    expect(component.showPassword).toBe(false);

    component.togglePassword();

    expect(component.showPassword).toBe(true);
  });

  it('should hide password when toggled twice', () => {
    expect(component.showPassword).toBe(false);

    component.togglePassword();
    component.togglePassword();

    expect(component.showPassword).toBe(false);
  });

  // ==========================================================
  // QUERY PARAMETER MESSAGE
  // ==========================================================

  it('should display message from query parameters', async () => {
    TestBed.resetTestingModule();

    authService = {
      login: vi.fn(),
    };

    router = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({
              message: 'You are merchant, not allow to use it',
            }),
          },
        },
      ],
    }).compileComponents();

    const messageFixture = TestBed.createComponent(Login);

    const messageComponent = messageFixture.componentInstance;

    messageFixture.detectChanges();

    expect(messageComponent.error).toBe('You are merchant, not allow to use it');
  });

  it('should not set error when query parameter message is missing', () => {
    expect(component.error).toBe('');
  });

  // ==========================================================
  // ERROR RESET
  // ==========================================================

  it('should clear previous error before starting a valid login', () => {
    const response = {
      token: 'customer-token',
      username: 'Junior',
      email: 'junior@example.com',
      role: 'CUSTOMER',
    };

    authService.login.mockReturnValue(of(response));

    component.error = 'Previous error';
    component.email = 'junior@example.com';
    component.password = 'Password1';

    component.login();

    expect(component.error).toBe('');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
