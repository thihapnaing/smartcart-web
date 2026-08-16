import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { of, throwError } from 'rxjs';

import { Signup } from './signup';

import { AuthService } from '../../services/auth.service';

import { Router } from '@angular/router';

import { ChangeDetectorRef } from '@angular/core';

//Author: Junior

describe('Signup', () => {
  let component: Signup;

  let authServiceMock: {
    register: ReturnType<typeof vi.fn>;
    createUserProfileWithAvatar: ReturnType<typeof vi.fn>;
  };

  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  let cdrMock: {
    detectChanges: ReturnType<typeof vi.fn>;
  };

  // =========================================================
  // SETUP
  // =========================================================

  beforeEach(() => {
    authServiceMock = {
      register: vi.fn(),

      createUserProfileWithAvatar: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    cdrMock = {
      detectChanges: vi.fn(),
    };

    component = new Signup(
      authServiceMock as unknown as AuthService,
      routerMock as unknown as Router,
      cdrMock as unknown as ChangeDetectorRef,
    );

    localStorage.clear();
  });

  // =========================================================
  // CLEANUP
  // =========================================================

  afterEach(() => {
    localStorage.clear();

    vi.restoreAllMocks();
  });

  // =========================================================
  // COMPONENT
  // =========================================================

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // =========================================================
  // INITIAL STATE
  // =========================================================

  describe('initial state', () => {
    it('should start at credentials step', () => {
      expect(component.signupStep).toBe('credentials');
    });

    it('should have empty credentials', () => {
      expect(component.fullName).toBe('');

      expect(component.email).toBe('');

      expect(component.password).toBe('');
    });

    it('should have empty profile information', () => {
      expect(component.firstName).toBe('');

      expect(component.lastName).toBe('');

      expect(component.address).toBe('');

      expect(component.postalCode).toBe('');

      expect(component.phoneNumber).toBe('');
    });

    it('should have no avatar selected', () => {
      expect(component.avatarFile).toBeNull();

      expect(component.avatarPreview).toBeNull();
    });

    it('should have loading false', () => {
      expect(component.loading).toBe(false);
    });

    it('should have no error message', () => {
      expect(component.errorMessage).toBe('');
    });

    it('should have password hidden', () => {
      expect(component.showPassword).toBe(false);
    });
  });

  // =========================================================
  // PASSWORD TOGGLE
  // =========================================================

  describe('togglePassword', () => {
    it('should show password after toggle', () => {
      expect(component.showPassword).toBe(false);

      component.togglePassword();

      expect(component.showPassword).toBe(true);
    });

    it('should hide password after toggling twice', () => {
      component.togglePassword();

      component.togglePassword();

      expect(component.showPassword).toBe(false);
    });
  });

  // =========================================================
  // SIGNUP - STEP 1
  // =========================================================

  describe('signup - credentials step', () => {
    // =======================================================
    // EMPTY USERNAME
    // =======================================================

    it('should reject empty username', () => {
      component.fullName = '';

      component.email = 'john@example.com';

      component.password = 'Password1';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your username.');

      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    // =======================================================
    // SPACES ONLY USERNAME
    // =======================================================

    it('should reject spaces-only username', () => {
      component.fullName = '   ';

      component.email = 'john@example.com';

      component.password = 'Password1';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your username.');

      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    // =======================================================
    // EMPTY EMAIL
    // =======================================================

    it('should reject empty email', () => {
      component.fullName = 'john';

      component.email = '';

      component.password = 'Password1';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your email.');

      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    // =======================================================
    // INVALID EMAIL
    // =======================================================

    it('should reject invalid email', () => {
      component.fullName = 'john';

      component.email = 'invalid-email';

      component.password = 'Password1';

      component.signup();

      expect(component.errorMessage).toBe('Please enter a valid email address.');

      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    // =======================================================
    // EMPTY PASSWORD
    // =======================================================

    it('should reject empty password', () => {
      component.fullName = 'john';

      component.email = 'john@example.com';

      component.password = '';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your password.');

      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    // =======================================================
    // PASSWORD TOO SHORT
    // =======================================================

    it('should reject password shorter than 6 characters', () => {
      component.fullName = 'john';

      component.email = 'john@example.com';

      component.password = 'Pass1';

      component.signup();

      expect(component.errorMessage).toBe('Password must be at least 6 characters.');

      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    // =======================================================
    // NO UPPERCASE
    // =======================================================

    it('should reject password without uppercase letter', () => {
      component.fullName = 'john';

      component.email = 'john@example.com';

      component.password = 'password1';

      component.signup();

      expect(component.errorMessage).toBe('Password must contain at least one uppercase letter.');

      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    // =======================================================
    // NO LOWERCASE
    // =======================================================

    it('should reject password without lowercase letter', () => {
      component.fullName = 'john';

      component.email = 'john@example.com';

      component.password = 'PASSWORD1';

      component.signup();

      expect(component.errorMessage).toBe('Password must contain at least one lowercase letter.');

      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    // =======================================================
    // NO NUMBER
    // =======================================================

    it('should reject password without number', () => {
      component.fullName = 'john';

      component.email = 'john@example.com';

      component.password = 'Password';

      component.signup();

      expect(component.errorMessage).toBe('Password must contain at least one number.');

      expect(authServiceMock.register).not.toHaveBeenCalled();
    });
  });

  // =========================================================
  // STEP 1 SUCCESS
  // =========================================================

  describe('customer registration success', () => {
    it('should register successfully and move to profile step', () => {
      component.fullName = '  john  ';

      component.email = '  john@example.com  ';

      component.password = 'Password1';

      authServiceMock.register.mockReturnValue(
        of({
          token: 'customer-jwt-token',

          userId: 1,

          username: 'john',

          email: 'john@example.com',

          role: 'CUSTOMER',
        }),
      );

      component.signup();

      expect(authServiceMock.register).toHaveBeenCalledTimes(1);

      expect(authServiceMock.register).toHaveBeenCalledWith({
        username: 'john',

        email: 'john@example.com',

        password: 'Password1',
      });

      expect(component.loading).toBe(false);

      expect(component.signupStep).toBe('profile');

      expect(component.errorMessage).toBe('');
    });

    it('should save pending user ID', () => {
      component.fullName = 'john';

      component.email = 'john@example.com';

      component.password = 'Password1';

      authServiceMock.register.mockReturnValue(
        of({
          token: 'customer-jwt-token',

          userId: 1,

          username: 'john',

          email: 'john@example.com',

          role: 'CUSTOMER',
        }),
      );

      component.signup();

      expect(localStorage.getItem('pendingSignupUserId')).toBe('1');
    });

    it('should save JWT token', () => {
      component.fullName = 'john';

      component.email = 'john@example.com';

      component.password = 'Password1';

      authServiceMock.register.mockReturnValue(
        of({
          token: 'customer-jwt-token',

          userId: 1,

          username: 'john',

          email: 'john@example.com',

          role: 'CUSTOMER',
        }),
      );

      component.signup();

      expect(localStorage.getItem('token')).toBe('customer-jwt-token');
    });

    it('should save username, email and role', () => {
      component.fullName = 'john';

      component.email = 'john@example.com';

      component.password = 'Password1';

      authServiceMock.register.mockReturnValue(
        of({
          token: 'customer-jwt-token',

          userId: 1,

          username: 'john',

          email: 'john@example.com',

          role: 'CUSTOMER',
        }),
      );

      component.signup();

      expect(localStorage.getItem('username')).toBe('john');

      expect(localStorage.getItem('email')).toBe('john@example.com');

      expect(localStorage.getItem('role')).toBe('CUSTOMER');
    });

    it('should accept trimmed username and email', () => {
      component.fullName = '   john   ';

      component.email = '   john@example.com   ';

      component.password = 'Password1';

      authServiceMock.register.mockReturnValue(
        of({
          token: 'customer-jwt-token',

          userId: 1,

          username: 'john',

          email: 'john@example.com',

          role: 'CUSTOMER',
        }),
      );

      component.signup();

      expect(authServiceMock.register).toHaveBeenCalledWith({
        username: 'john',

        email: 'john@example.com',

        password: 'Password1',
      });
    });
  });

  // =========================================================
  // STEP 1 MISSING USER ID
  // =========================================================

  describe('registration response validation', () => {
    it('should display error when user ID is missing', () => {
      component.fullName = 'john';

      component.email = 'john@example.com';

      component.password = 'Password1';

      authServiceMock.register.mockReturnValue(
        of({
          token: 'customer-jwt-token',

          username: 'john',

          email: 'john@example.com',

          role: 'CUSTOMER',
        }),
      );

      component.signup();

      expect(component.errorMessage).toBe(
        'Account was created, but user information was not returned.',
      );

      expect(component.signupStep).toBe('credentials');
    });

    it('should display error when token is missing', () => {
      component.fullName = 'john';

      component.email = 'john@example.com';

      component.password = 'Password1';

      authServiceMock.register.mockReturnValue(
        of({
          userId: 1,

          username: 'john',

          email: 'john@example.com',

          role: 'CUSTOMER',
        }),
      );

      component.signup();

      expect(component.errorMessage).toBe(
        'Account was created, but authentication token was not returned.',
      );

      expect(component.signupStep).toBe('credentials');
    });
  });

  // =========================================================
  // STEP 1 ERROR
  // =========================================================

  describe('registration errors', () => {
    it('should display backend text error', () => {
      component.fullName = 'john';

      component.email = 'john@example.com';

      component.password = 'Password1';

      authServiceMock.register.mockReturnValue(
        throwError(() => ({
          error: 'Email is already registered',
        })),
      );

      component.signup();

      expect(component.loading).toBe(false);

      expect(component.errorMessage).toBe('Email is already registered');
    });

    it('should display backend message error', () => {
      component.fullName = 'john';

      component.email = 'john@example.com';

      component.password = 'Password1';

      authServiceMock.register.mockReturnValue(
        throwError(() => ({
          error: {
            message: 'Email already exists',
          },
        })),
      );

      component.signup();

      expect(component.errorMessage).toBe('Email already exists');
    });

    it('should handle HTTP 400 error', () => {
      component.fullName = 'john';

      component.email = 'john@example.com';

      component.password = 'Password1';

      authServiceMock.register.mockReturnValue(
        throwError(() => ({
          status: 400,
        })),
      );

      component.signup();

      expect(component.errorMessage).toBe(
        'The username or email is already registered, or the information is invalid.',
      );
    });

    it('should handle HTTP 409 error', () => {
      component.fullName = 'john';

      component.email = 'john@example.com';

      component.password = 'Password1';

      authServiceMock.register.mockReturnValue(
        throwError(() => ({
          status: 409,
        })),
      );

      component.signup();

      expect(component.errorMessage).toBe('The username or email is already registered.');
    });

    it('should handle unknown registration error', () => {
      component.fullName = 'john';

      component.email = 'john@example.com';

      component.password = 'Password1';

      authServiceMock.register.mockReturnValue(
        throwError(() => ({
          status: 500,
        })),
      );

      component.signup();

      expect(component.errorMessage).toBe('Unable to create account. Please try again.');
    });
  });

  // =========================================================
  // STEP 2 - PROFILE
  // =========================================================

  describe('profile step', () => {
    beforeEach(() => {
      component.signupStep = 'profile';
    });

    it('should return to credentials when signup session is missing', () => {
      localStorage.removeItem('pendingSignupUserId');

      component.signup();

      expect(component.errorMessage).toBe('Your signup session has expired. Please start again.');

      expect(component.signupStep).toBe('credentials');
    });

    it('should reject invalid user ID', () => {
      localStorage.setItem('pendingSignupUserId', 'invalid');

      component.signup();

      expect(component.errorMessage).toBe('Invalid user information. Please start again.');

      expect(component.signupStep).toBe('credentials');
    });

    it('should reject zero user ID', () => {
      localStorage.setItem('pendingSignupUserId', '0');

      component.signup();

      expect(component.errorMessage).toBe('Invalid user information. Please start again.');

      expect(component.signupStep).toBe('credentials');
    });

    it('should require first name', () => {
      localStorage.setItem('pendingSignupUserId', '1');

      component.firstName = '';

      component.lastName = 'Tan';

      component.address = '12 Rainbow Street';

      component.postalCode = '123456';

      component.phoneNumber = '91234567';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your first name.');

      expect(authServiceMock.createUserProfileWithAvatar).not.toHaveBeenCalled();
    });

    it('should require last name', () => {
      localStorage.setItem('pendingSignupUserId', '1');

      component.firstName = 'John';

      component.lastName = '';

      component.address = '12 Rainbow Street';

      component.postalCode = '123456';

      component.phoneNumber = '91234567';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your last name.');

      expect(authServiceMock.createUserProfileWithAvatar).not.toHaveBeenCalled();
    });

    it('should require address', () => {
      localStorage.setItem('pendingSignupUserId', '1');

      component.firstName = 'John';

      component.lastName = 'Tan';

      component.address = '';

      component.postalCode = '123456';

      component.phoneNumber = '91234567';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your address.');
    });

    it('should require postal code', () => {
      localStorage.setItem('pendingSignupUserId', '1');

      component.firstName = 'John';

      component.lastName = 'Tan';

      component.address = '12 Rainbow Street';

      component.postalCode = '';

      component.phoneNumber = '91234567';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your postal code.');
    });

    it('should require phone number', () => {
      localStorage.setItem('pendingSignupUserId', '1');

      component.firstName = 'John';

      component.lastName = 'Tan';

      component.address = '12 Rainbow Street';

      component.postalCode = '123456';

      component.phoneNumber = '';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your phone number.');
    });

    it('should require authentication token', () => {
      localStorage.setItem('pendingSignupUserId', '1');

      localStorage.removeItem('token');

      component.firstName = 'John';

      component.lastName = 'Tan';

      component.address = '12 Rainbow Street';

      component.postalCode = '123456';

      component.phoneNumber = '91234567';

      component.signup();

      expect(component.errorMessage).toBe(
        'Authentication session is missing. Please start signup again.',
      );

      expect(component.signupStep).toBe('credentials');
    });
  });

  // =========================================================
  // STEP 2 SUCCESS
  // =========================================================

  describe('profile creation success', () => {
    beforeEach(() => {
      component.signupStep = 'profile';

      localStorage.setItem('pendingSignupUserId', '1');

      localStorage.setItem('token', 'customer-jwt-token');

      component.firstName = '  John  ';

      component.lastName = '  Tan  ';

      component.address = ' 12 Rainbow Street ';

      component.postalCode = ' 123456 ';

      component.phoneNumber = ' 91234567 ';
    });

    it('should create profile successfully', () => {
      const avatarFile = new File(['avatar'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      component.avatarFile = avatarFile;

      authServiceMock.createUserProfileWithAvatar.mockReturnValue(
        of({
          id: 1,

          firstName: 'John',

          lastName: 'Tan',
        }),
      );

      component.signup();

      expect(authServiceMock.createUserProfileWithAvatar).toHaveBeenCalledTimes(1);

      expect(authServiceMock.createUserProfileWithAvatar).toHaveBeenCalledWith(
        1,

        'John',

        'Tan',

        '12 Rainbow Street',

        '123456',

        '91234567',

        avatarFile,
      );

      expect(component.loading).toBe(false);

      expect(component.errorMessage).toBe('');

      expect(localStorage.getItem('pendingSignupUserId')).toBeNull();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should create profile without avatar', () => {
      component.avatarFile = null;

      authServiceMock.createUserProfileWithAvatar.mockReturnValue(
        of({
          id: 1,
        }),
      );

      component.signup();

      expect(authServiceMock.createUserProfileWithAvatar).toHaveBeenCalledWith(
        1,

        'John',

        'Tan',

        '12 Rainbow Street',

        '123456',

        '91234567',

        null,
      );

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // =========================================================
  // PROFILE CREATION ERRORS
  // =========================================================

  describe('profile creation errors', () => {
    beforeEach(() => {
      component.signupStep = 'profile';

      localStorage.setItem('pendingSignupUserId', '1');

      localStorage.setItem('token', 'customer-jwt-token');

      component.firstName = 'John';

      component.lastName = 'Tan';

      component.address = '12 Rainbow Street';

      component.postalCode = '123456';

      component.phoneNumber = '91234567';
    });

    it('should display backend text error', () => {
      authServiceMock.createUserProfileWithAvatar.mockReturnValue(
        throwError(() => ({
          error: 'Unable to save profile',
        })),
      );

      component.signup();

      expect(component.loading).toBe(false);

      expect(component.errorMessage).toBe('Unable to save profile');

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should handle 403 error', () => {
      authServiceMock.createUserProfileWithAvatar.mockReturnValue(
        throwError(() => ({
          status: 403,
        })),
      );

      component.signup();

      expect(component.errorMessage).toBe(
        'You are not authorized to create this profile. Please sign up again.',
      );

      expect(component.loading).toBe(false);
    });

    it('should handle 413 error', () => {
      authServiceMock.createUserProfileWithAvatar.mockReturnValue(
        throwError(() => ({
          status: 413,
        })),
      );

      component.signup();

      expect(component.errorMessage).toBe('The avatar image is too large. Maximum size is 2 MB.');

      expect(component.loading).toBe(false);
    });

    it('should handle unknown profile error', () => {
      authServiceMock.createUserProfileWithAvatar.mockReturnValue(
        throwError(() => ({
          status: 500,
        })),
      );

      component.signup();

      expect(component.errorMessage).toBe('Unable to save your profile. Please try again.');

      expect(component.loading).toBe(false);
    });

    it('should handle backend message object', () => {
      authServiceMock.createUserProfileWithAvatar.mockReturnValue(
        throwError(() => ({
          error: {
            message: 'Profile already exists',
          },
        })),
      );

      component.signup();

      expect(component.errorMessage).toBe('Profile already exists');
    });

    it('should handle backend error object', () => {
      authServiceMock.createUserProfileWithAvatar.mockReturnValue(
        throwError(() => ({
          error: {
            error: 'Profile creation failed',
          },
        })),
      );

      component.signup();

      expect(component.errorMessage).toBe('Profile creation failed');
    });

    it('should handle backend detail object', () => {
      authServiceMock.createUserProfileWithAvatar.mockReturnValue(
        throwError(() => ({
          error: {
            detail: 'Invalid profile details',
          },
        })),
      );

      component.signup();

      expect(component.errorMessage).toBe('Invalid profile details');
    });
  });

  // =========================================================
  // AVATAR SELECTION
  // =========================================================

  describe('onAvatarSelected', () => {
    it('should do nothing when no file is selected', () => {
      const input = document.createElement('input');

      input.type = 'file';

      const event = {
        target: input,
      } as unknown as Event;

      component.onAvatarSelected(event);

      expect(component.avatarFile).toBeNull();

      expect(component.avatarPreview).toBeNull();
    });

    it('should reject non-image file', () => {
      const file = new File(['document'], 'document.pdf', {
        type: 'application/pdf',
      });

      const input = document.createElement('input');

      input.type = 'file';

      Object.defineProperty(input, 'files', {
        value: [file],
      });

      const event = {
        target: input,
      } as unknown as Event;

      component.onAvatarSelected(event);

      expect(component.errorMessage).toBe('Please select a valid image file.');

      expect(component.avatarFile).toBeNull();
    });

    it('should reject image larger than 2 MB', () => {
      const file = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.jpg', {
        type: 'image/jpeg',
      });

      const input = document.createElement('input');

      input.type = 'file';

      Object.defineProperty(input, 'files', {
        value: [file],
      });

      const event = {
        target: input,
      } as unknown as Event;

      component.onAvatarSelected(event);

      expect(component.errorMessage).toBe('Avatar image must be smaller than 2 MB.');

      expect(component.avatarFile).toBeNull();

      expect(component.avatarPreview).toBeNull();
    });

    it('should accept a valid image file', () => {
      const file = new File(['image content'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      const input = document.createElement('input');

      input.type = 'file';

      Object.defineProperty(input, 'files', {
        value: [file],
      });

      const event = {
        target: input,
      } as unknown as Event;

      component.onAvatarSelected(event);

      expect(component.avatarFile).toBe(file);

      expect(component.errorMessage).toBe('');
    });
  });

  // =========================================================
  // BACK TO CREDENTIALS
  // =========================================================

  describe('backToCredentials', () => {
    it('should return to credentials step', () => {
      component.signupStep = 'profile';

      component.errorMessage = 'Some error';

      component.backToCredentials();

      expect(component.signupStep).toBe('credentials');

      expect(component.errorMessage).toBe('');
    });
  });
});
