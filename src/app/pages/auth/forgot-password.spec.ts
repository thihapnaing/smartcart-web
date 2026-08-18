import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideRouter, Router } from '@angular/router';

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { of, throwError } from 'rxjs';

import { ForgotPassword } from './forgot-password';
import { AuthService } from '../../services/auth.service';

describe('ForgotPassword', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;
  let router: Router;

  let authService: {
    checkEmail: ReturnType<typeof vi.fn>;
    resetPassword: ReturnType<typeof vi.fn>;
  };

  // ==========================================================
  // SETUP
  // ==========================================================

  beforeEach(async () => {
    authService = {
      checkEmail: vi.fn(),

      resetPassword: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPassword],

      providers: [
        provideRouter([]),

        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);

    component = fixture.componentInstance;

    router = TestBed.inject(Router);

    fixture.detectChanges();
  });

  // ==========================================================
  // CREATE
  // ==========================================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ==========================================================
  // INITIAL FORM VALUES
  // ==========================================================

  it('should initialize form fields correctly', () => {
    expect(component.email).toBe('');

    expect(component.newPassword).toBe('');

    expect(component.confirmPassword).toBe('');

    expect(component.showNewPassword).toBe(false);

    expect(component.showConfirmPassword).toBe(false);

    expect(component.loading).toBe(false);

    expect(component.error).toBe('');

    expect(component.success).toBe('');

    expect(component.emailVerified).toBe(false);
  });

  // ==========================================================
  // CHECK EMAIL
  // ==========================================================

  describe('checkEmail()', () => {
    it('should show error when email is empty', () => {
      component.email = '';

      component.checkEmail();

      expect(component.error).toBe('Please enter your email.');
    });

    it('should show error when email contains only spaces', () => {
      component.email = '   ';

      component.checkEmail();

      expect(component.error).toBe('Please enter your email.');
    });

    it('should reject invalid email format', () => {
      component.email = 'abc';

      component.checkEmail();

      expect(component.error).toBe('Please enter a valid email address.');
    });

    it('should reject email without @', () => {
      component.email = 'abc.com';

      component.checkEmail();

      expect(component.error).toBe('Please enter a valid email address.');
    });

    it('should reject email without domain', () => {
      component.email = 'abc@';

      component.checkEmail();

      expect(component.error).toBe('Please enter a valid email address.');
    });

    it('should check email when email is valid', () => {
      component.email = 'test@example.com';

      authService.checkEmail.mockReturnValue(
        of({
          exists: true,
        }),
      );

      component.checkEmail();

      expect(authService.checkEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should trim email before checking', () => {
      component.email = '  test@example.com  ';

      authService.checkEmail.mockReturnValue(
        of({
          exists: true,
        }),
      );

      component.checkEmail();

      expect(authService.checkEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should mark email as verified when backend succeeds', () => {
      component.email = 'test@example.com';

      authService.checkEmail.mockReturnValue(
        of({
          exists: true,
        }),
      );

      component.checkEmail();

      expect(component.emailVerified).toBe(true);
    });

    it('should clear error when email check succeeds', () => {
      component.email = 'test@example.com';

      component.error = 'Previous error';

      authService.checkEmail.mockReturnValue(
        of({
          exists: true,
        }),
      );

      component.checkEmail();

      expect(component.error).toBe('');
    });

    it('should stop loading after successful email check', () => {
      component.email = 'test@example.com';

      authService.checkEmail.mockReturnValue(
        of({
          exists: true,
        }),
      );

      component.checkEmail();

      expect(component.loading).toBe(false);
    });

    it('should show error when email check fails', () => {
      component.email = 'missing@example.com';

      authService.checkEmail.mockReturnValue(
        throwError(() => ({
          error: {
            message: 'Email address not found.',
          },
        })),
      );

      component.checkEmail();

      expect(component.error).toBe('Email address not found.');
    });

    it('should use backend error message when provided as string', () => {
      component.email = 'test@example.com';

      authService.checkEmail.mockReturnValue(
        throwError(() => ({
          error: 'Email does not exist.',
        })),
      );

      component.checkEmail();

      expect(component.error).toBe('Email does not exist.');
    });

    it('should stop loading when email check fails', () => {
      component.email = 'test@example.com';

      authService.checkEmail.mockReturnValue(throwError(() => new Error('Server error')));

      component.checkEmail();

      expect(component.loading).toBe(false);
    });
  });

  // ==========================================================
  // RESET PASSWORD
  // ==========================================================

  describe('resetPassword()', () => {
    it('should require email verification first', () => {
      component.emailVerified = false;

      component.newPassword = 'Password1';

      component.confirmPassword = 'Password1';

      component.resetPassword();

      expect(component.error).toBe('Please check your email address first.');
    });

    it('should show error when new password is empty', () => {
      component.emailVerified = true;

      component.newPassword = '';

      component.confirmPassword = 'Password1';

      component.resetPassword();

      expect(component.error).toBe('Please enter your new password.');
    });

    it('should reject password shorter than 6 characters', () => {
      component.emailVerified = true;

      component.newPassword = 'Ab1';

      component.confirmPassword = 'Ab1';

      component.resetPassword();

      expect(component.error).toBe('Password must be at least 6 characters.');
    });

    it('should require an uppercase letter', () => {
      component.emailVerified = true;

      component.newPassword = 'password1';

      component.confirmPassword = 'password1';

      component.resetPassword();

      expect(component.error).toBe('Password must contain at least one uppercase letter.');
    });

    it('should require a lowercase letter', () => {
      component.emailVerified = true;

      component.newPassword = 'PASSWORD1';

      component.confirmPassword = 'PASSWORD1';

      component.resetPassword();

      expect(component.error).toBe('Password must contain at least one lowercase letter.');
    });

    it('should require a number', () => {
      component.emailVerified = true;

      component.newPassword = 'Password';

      component.confirmPassword = 'Password';

      component.resetPassword();

      expect(component.error).toBe('Password must contain at least one number.');
    });

    it('should require confirm password', () => {
      component.emailVerified = true;

      component.newPassword = 'Password1';

      component.confirmPassword = '';

      component.resetPassword();

      expect(component.error).toBe('Please confirm your password.');
    });

    it('should reject passwords that do not match', () => {
      component.emailVerified = true;

      component.newPassword = 'Password1';

      component.confirmPassword = 'Password2';

      component.resetPassword();

      expect(component.error).toBe('Passwords do not match.');
    });

    it('should reset password when all validation passes', () => {
      component.email = 'test@example.com';

      component.emailVerified = true;

      component.newPassword = 'Password1';

      component.confirmPassword = 'Password1';

      authService.resetPassword.mockReturnValue(
        of({
          message: 'Password updated successfully.',
        }),
      );

      component.resetPassword();

      expect(authService.resetPassword).toHaveBeenCalledWith({
        email: 'test@example.com',

        newPassword: 'Password1',

        confirmPassword: 'Password1',
      });
    });

    it('should trim email before resetting password', () => {
      component.email = '  test@example.com  ';

      component.emailVerified = true;

      component.newPassword = 'Password1';

      component.confirmPassword = 'Password1';

      authService.resetPassword.mockReturnValue(
        of({
          message: 'Password updated successfully.',
        }),
      );

      component.resetPassword();

      expect(authService.resetPassword).toHaveBeenCalledWith({
        email: 'test@example.com',

        newPassword: 'Password1',

        confirmPassword: 'Password1',
      });
    });

    it('should display backend reset password error', () => {
      component.email = 'test@example.com';

      component.emailVerified = true;

      component.newPassword = 'Password1';

      component.confirmPassword = 'Password1';

      authService.resetPassword.mockReturnValue(
        throwError(() => ({
          error: {
            message: 'Reset password failed',
          },
        })),
      );

      component.resetPassword();

      expect(component.error).toBe('Reset password failed');
    });

    it('should handle string reset password error', () => {
      component.email = 'test@example.com';

      component.emailVerified = true;

      component.newPassword = 'Password1';

      component.confirmPassword = 'Password1';

      authService.resetPassword.mockReturnValue(
        throwError(() => ({
          error: 'Reset password failed',
        })),
      );

      component.resetPassword();

      expect(component.error).toBe('Reset password failed');
    });

    it('should stop loading after successful password reset', () => {
      component.email = 'test@example.com';

      component.emailVerified = true;

      component.newPassword = 'Password1';

      component.confirmPassword = 'Password1';

      authService.resetPassword.mockReturnValue(
        of({
          message: 'Success',
        }),
      );

      component.resetPassword();

      expect(component.loading).toBe(false);
    });

    it('should stop loading after failed password reset', () => {
      component.email = 'test@example.com';

      component.emailVerified = true;

      component.newPassword = 'Password1';

      component.confirmPassword = 'Password1';

      authService.resetPassword.mockReturnValue(throwError(() => new Error('Server error')));

      component.resetPassword();

      expect(component.loading).toBe(false);
    });
  });

  // ==========================================================
  // PASSWORD VISIBILITY
  // ==========================================================

  describe('password visibility', () => {
    it('should initially hide new password', () => {
      expect(component.showNewPassword).toBe(false);
    });

    it('should toggle new password visibility', () => {
      expect(component.showNewPassword).toBe(false);

      component.toggleNewPassword();

      expect(component.showNewPassword).toBe(true);

      component.toggleNewPassword();

      expect(component.showNewPassword).toBe(false);
    });

    it('should initially hide confirm password', () => {
      expect(component.showConfirmPassword).toBe(false);
    });

    it('should toggle confirm password visibility', () => {
      expect(component.showConfirmPassword).toBe(false);

      component.toggleConfirmPassword();

      expect(component.showConfirmPassword).toBe(true);

      component.toggleConfirmPassword();

      expect(component.showConfirmPassword).toBe(false);
    });
  });

  // ==========================================================
  // BACK TO LOGIN
  // ==========================================================

  describe('backToLogin()', () => {
    it('should navigate to login page', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.backToLogin();

      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });
});
