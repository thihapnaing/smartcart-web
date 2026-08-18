import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { ForgotPassword } from './forgot-password';
import { AuthService } from '../../services/auth.service';

//Authr: Junior

describe('ForgotPassword', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;

  let authServiceMock: {
    checkEmail: ReturnType<typeof vi.fn>;
    resetPassword: ReturnType<typeof vi.fn>;
  };

  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  // =========================================================
  // BEFORE EACH
  // =========================================================

  beforeEach(async () => {
    authServiceMock = {
      checkEmail: vi.fn(),
      resetPassword: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPassword],

      providers: [
        // Required because ForgotPassword imports RouterLink
        provideRouter([]),

        // Mock AuthService
        {
          provide: AuthService,
          useValue: authServiceMock,
        },

        // Mock Router
        {
          provide: Router,
          useValue: routerMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);

    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  // =========================================================
  // COMPONENT
  // =========================================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // =========================================================
  // INITIAL VALUES
  // =========================================================

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

  // =========================================================
  // CHECK EMAIL
  // =========================================================

  describe('checkEmail()', () => {
    it('should show error when email is empty', () => {
      component.email = '';

      component.checkEmail();

      expect(component.error).toBe('Please enter your email.');

      expect(component.emailVerified).toBe(false);

      expect(authServiceMock.checkEmail).not.toHaveBeenCalled();
    });

    it('should show error when email contains only spaces', () => {
      component.email = '   ';

      component.checkEmail();

      expect(component.error).toBe('Please enter your email.');

      expect(authServiceMock.checkEmail).not.toHaveBeenCalled();
    });

    it('should reject invalid email format', () => {
      component.email = 'invalid-email';

      component.checkEmail();

      expect(component.error).toBe('Please enter a valid email address.');

      expect(component.emailVerified).toBe(false);

      expect(authServiceMock.checkEmail).not.toHaveBeenCalled();
    });

    it('should reject email without @', () => {
      component.email = 'john.example.com';

      component.checkEmail();

      expect(component.error).toBe('Please enter a valid email address.');

      expect(authServiceMock.checkEmail).not.toHaveBeenCalled();
    });

    it('should reject email without domain', () => {
      component.email = 'john@';

      component.checkEmail();

      expect(component.error).toBe('Please enter a valid email address.');

      expect(authServiceMock.checkEmail).not.toHaveBeenCalled();
    });

    it('should check email when email is valid', () => {
      component.email = 'john@smartcart.com';

      authServiceMock.checkEmail.mockReturnValue(
        of({
          message: 'Email address found',
        }),
      );

      component.checkEmail();

      expect(authServiceMock.checkEmail).toHaveBeenCalledWith('john@smartcart.com');

      expect(component.emailVerified).toBe(true);

      expect(component.loading).toBe(false);

      expect(component.error).toBe('');
    });

    it('should trim email before checking', () => {
      component.email = '  john@smartcart.com  ';

      authServiceMock.checkEmail.mockReturnValue(
        of({
          message: 'Email address found',
        }),
      );

      component.checkEmail();

      expect(authServiceMock.checkEmail).toHaveBeenCalledWith('john@smartcart.com');

      expect(component.emailVerified).toBe(true);
    });

    it('should show error when email is not found', () => {
      component.email = 'unknown@smartcart.com';

      authServiceMock.checkEmail.mockReturnValue(
        throwError(() => ({
          error: {
            message: 'Email address not found',
          },
        })),
      );

      component.checkEmail();

      expect(component.emailVerified).toBe(false);

      expect(component.loading).toBe(false);

      expect(component.error).toBe('Email address not found.');
    });

    it('should use backend error message when provided as string', () => {
      component.email = 'unknown@smartcart.com';

      authServiceMock.checkEmail.mockReturnValue(
        throwError(() => ({
          error: 'Email address not found.',
        })),
      );

      component.checkEmail();

      expect(component.emailVerified).toBe(false);

      expect(component.loading).toBe(false);

      expect(component.error).toBe('Email address not found.');
    });

    it('should stop loading after successful email check', () => {
      component.email = 'john@smartcart.com';

      authServiceMock.checkEmail.mockReturnValue(
        of({
          message: 'Email address found',
        }),
      );

      component.loading = true;

      component.checkEmail();

      expect(component.loading).toBe(false);
    });

    it('should stop loading when email check fails', () => {
      component.email = 'unknown@smartcart.com';

      authServiceMock.checkEmail.mockReturnValue(
        throwError(() => ({
          error: {
            message: 'Email address not found.',
          },
        })),
      );

      component.loading = true;

      component.checkEmail();

      expect(component.loading).toBe(false);
    });
  });

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  describe('resetPassword()', () => {
    // -------------------------------------------------------
    // EMAIL VERIFICATION
    // -------------------------------------------------------

    it('should require email verification first', () => {
      component.emailVerified = false;

      component.resetPassword();

      expect(component.error).toBe('Please check your email address first.');

      expect(authServiceMock.resetPassword).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------
    // EMPTY PASSWORD
    // -------------------------------------------------------

    it('should show error when new password is empty', () => {
      component.emailVerified = true;

      component.newPassword = '';

      component.resetPassword();

      expect(component.error).toBe('Please enter your new password.');

      expect(authServiceMock.resetPassword).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------
    // PASSWORD LENGTH
    // -------------------------------------------------------

    it('should reject password shorter than 6 characters', () => {
      component.emailVerified = true;

      component.newPassword = 'Ab1';
      component.confirmPassword = 'Ab1';

      component.resetPassword();

      expect(component.error).toBe('Password must be at least 6 characters.');

      expect(authServiceMock.resetPassword).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------
    // UPPERCASE
    // -------------------------------------------------------

    it('should require an uppercase letter', () => {
      component.emailVerified = true;

      component.newPassword = 'password1';
      component.confirmPassword = 'password1';

      component.resetPassword();

      expect(component.error).toBe('Password must contain at least one uppercase letter.');

      expect(authServiceMock.resetPassword).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------
    // LOWERCASE
    // -------------------------------------------------------

    it('should require a lowercase letter', () => {
      component.emailVerified = true;

      component.newPassword = 'PASSWORD1';
      component.confirmPassword = 'PASSWORD1';

      component.resetPassword();

      expect(component.error).toBe('Password must contain at least one lowercase letter.');

      expect(authServiceMock.resetPassword).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------
    // NUMBER
    // -------------------------------------------------------

    it('should require a number', () => {
      component.emailVerified = true;

      component.newPassword = 'Password';
      component.confirmPassword = 'Password';

      component.resetPassword();

      expect(component.error).toBe('Password must contain at least one number.');

      expect(authServiceMock.resetPassword).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------
    // CONFIRM PASSWORD EMPTY
    // -------------------------------------------------------

    it('should require confirm password', () => {
      component.emailVerified = true;

      component.newPassword = 'Password1';
      component.confirmPassword = '';

      component.resetPassword();

      expect(component.error).toBe('Please confirm your password.');

      expect(authServiceMock.resetPassword).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------
    // PASSWORD MISMATCH
    // -------------------------------------------------------

    it('should reject passwords that do not match', () => {
      component.emailVerified = true;

      component.newPassword = 'Password1';
      component.confirmPassword = 'Password2';

      component.resetPassword();

      expect(component.error).toBe('Passwords do not match.');

      expect(authServiceMock.resetPassword).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------
    // VALID PASSWORD
    // -------------------------------------------------------

    it('should reset password when all validation passes', () => {
      component.email = 'john@smartcart.com';

      component.emailVerified = true;

      component.newPassword = 'Password1';
      component.confirmPassword = 'Password1';

      authServiceMock.resetPassword.mockReturnValue(
        of({
          message: 'Password updated successfully.',
        }),
      );

      component.resetPassword();

      expect(authServiceMock.resetPassword).toHaveBeenCalledWith({
        email: 'john@smartcart.com',
        newPassword: 'Password1',
        confirmPassword: 'Password1',
      });

      expect(component.loading).toBe(false);

      expect(component.success).toBe('Password updated successfully.');

      expect(component.error).toBe('');

      expect(component.newPassword).toBe('');

      expect(component.confirmPassword).toBe('');
    });

    // -------------------------------------------------------
    // TRIM EMAIL
    // -------------------------------------------------------

    it('should trim email before resetting password', () => {
      component.email = '  john@smartcart.com  ';

      component.emailVerified = true;

      component.newPassword = 'Password1';
      component.confirmPassword = 'Password1';

      authServiceMock.resetPassword.mockReturnValue(
        of({
          message: 'Password updated successfully.',
        }),
      );

      component.resetPassword();

      expect(authServiceMock.resetPassword).toHaveBeenCalledWith({
        email: 'john@smartcart.com',
        newPassword: 'Password1',
        confirmPassword: 'Password1',
      });
    });

    // -------------------------------------------------------
    // RESET PASSWORD ERROR
    // -------------------------------------------------------

    it('should display backend reset password error', () => {
      component.email = 'john@smartcart.com';

      component.emailVerified = true;

      component.newPassword = 'Password1';
      component.confirmPassword = 'Password1';

      authServiceMock.resetPassword.mockReturnValue(
        throwError(() => ({
          error: {
            message: 'Unable to reset password.',
          },
        })),
      );

      component.resetPassword();

      expect(component.loading).toBe(false);

      expect(component.error).toBe('Unable to reset password.');

      expect(component.success).toBe('');
    });

    // -------------------------------------------------------
    // RESET PASSWORD STRING ERROR
    // -------------------------------------------------------

    it('should handle string reset password error', () => {
      component.email = 'john@smartcart.com';

      component.emailVerified = true;

      component.newPassword = 'Password1';
      component.confirmPassword = 'Password1';

      authServiceMock.resetPassword.mockReturnValue(
        throwError(() => ({
          error: 'Password reset failed.',
        })),
      );

      component.resetPassword();

      expect(component.loading).toBe(false);

      expect(component.error).toBe('Password reset failed.');
    });
  });

  // =========================================================
  // PASSWORD VISIBILITY
  // =========================================================

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

  // =========================================================
  // BACK TO LOGIN
  // =========================================================

  describe('backToLogin()', () => {
    it('should navigate to login page', () => {
      component.backToLogin();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // =========================================================
  // LOADING STATE
  // =========================================================

  describe('loading state', () => {
    it('should stop loading after successful password reset', () => {
      component.email = 'john@smartcart.com';

      component.emailVerified = true;

      component.newPassword = 'Password1';
      component.confirmPassword = 'Password1';

      component.loading = true;

      authServiceMock.resetPassword.mockReturnValue(
        of({
          message: 'Password updated successfully.',
        }),
      );

      component.resetPassword();

      expect(component.loading).toBe(false);
    });

    it('should stop loading after failed password reset', () => {
      component.email = 'john@smartcart.com';

      component.emailVerified = true;

      component.newPassword = 'Password1';
      component.confirmPassword = 'Password1';

      component.loading = true;

      authServiceMock.resetPassword.mockReturnValue(
        throwError(() => ({
          error: {
            message: 'Unable to reset password.',
          },
        })),
      );

      component.resetPassword();

      expect(component.loading).toBe(false);
    });
  });
});
