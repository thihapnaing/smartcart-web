import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { MerchantSignup } from './merchant-signup';

import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

//Author: Junior

describe('MerchantSignup', () => {
  let component: MerchantSignup;

  let authServiceMock: {
    registerMerchant: ReturnType<typeof vi.fn>;
    createMerchantProfile: ReturnType<typeof vi.fn>;
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
      registerMerchant: vi.fn(),

      createMerchantProfile: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    cdrMock = {
      detectChanges: vi.fn(),
    };

    component = new MerchantSignup(
      authServiceMock as unknown as AuthService,
      routerMock as unknown as Router,
      cdrMock as unknown as ChangeDetectorRef,
    );

    localStorage.clear();

    // jsdom does not implement scrollTo
    vi.stubGlobal('scrollTo', vi.fn());
  });

  // =========================================================
  // CLEANUP
  // =========================================================

  afterEach(() => {
    localStorage.clear();

    vi.restoreAllMocks();
  });

  // =========================================================
  // COMPONENT CREATION
  // =========================================================

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // =========================================================
  // INITIAL VALUES
  // =========================================================

  describe('initial state', () => {
    it('should start on step 1', () => {
      expect(component.signupStep).toBe(1);
    });

    it('should start with empty error message', () => {
      expect(component.errorMessage).toBe('');
    });

    it('should start with loading false', () => {
      expect(component.loading).toBe(false);
    });

    it('should start with password hidden', () => {
      expect(component.showPassword).toBe(false);
    });

    it('should start with no selected files', () => {
      expect(component.logoFile).toBeNull();

      expect(component.logoPreview).toBeNull();

      expect(component.businessDocument).toBeNull();
    });
  });

  // =========================================================
  // PASSWORD
  // =========================================================

  describe('togglePassword', () => {
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

  // =========================================================
  // SIGNUP ENTRY POINT
  // =========================================================

  describe('signup', () => {
    it('should call step 1 registration when signupStep is 1', () => {
      component.signupStep = 1;

      component.username = '';
      component.email = '';
      component.password = '';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your username.');
    });

    it('should call step 2 submission when signupStep is 2', () => {
      component.signupStep = 2;

      component.signup();

      expect(component.errorMessage).toBe('Please enter your business or shop name.');
    });
  });

  // =========================================================
  // STEP 1 - VALIDATION
  // =========================================================

  describe('merchant registration - step 1 validation', () => {
    it('should reject empty username', () => {
      component.username = '';
      component.email = 'merchant@example.com';
      component.password = 'Password1';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your username.');

      expect(authServiceMock.registerMerchant).not.toHaveBeenCalled();
    });

    it('should reject username shorter than 3 characters', () => {
      component.username = 'ab';
      component.email = 'merchant@example.com';
      component.password = 'Password1';

      component.signup();

      expect(component.errorMessage).toBe('Username must be at least 3 characters.');

      expect(authServiceMock.registerMerchant).not.toHaveBeenCalled();
    });

    it('should reject empty email', () => {
      component.username = 'merchant01';
      component.email = '';
      component.password = 'Password1';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your email.');

      expect(authServiceMock.registerMerchant).not.toHaveBeenCalled();
    });

    it('should reject invalid email', () => {
      component.username = 'merchant01';
      component.email = 'invalid-email';
      component.password = 'Password1';

      component.signup();

      expect(component.errorMessage).toBe('Please enter a valid email address.');

      expect(authServiceMock.registerMerchant).not.toHaveBeenCalled();
    });

    it('should reject empty password', () => {
      component.username = 'merchant01';
      component.email = 'merchant@example.com';
      component.password = '';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your password.');

      expect(authServiceMock.registerMerchant).not.toHaveBeenCalled();
    });

    it('should reject password shorter than 6 characters', () => {
      component.username = 'merchant01';
      component.email = 'merchant@example.com';
      component.password = 'Pass1';

      component.signup();

      expect(component.errorMessage).toBe('Password must be at least 6 characters.');

      expect(authServiceMock.registerMerchant).not.toHaveBeenCalled();
    });

    it('should reject password without uppercase letter', () => {
      component.username = 'merchant01';
      component.email = 'merchant@example.com';
      component.password = 'password1';

      component.signup();

      expect(component.errorMessage).toBe('Password must contain at least one uppercase letter.');

      expect(authServiceMock.registerMerchant).not.toHaveBeenCalled();
    });

    it('should reject password without lowercase letter', () => {
      component.username = 'merchant01';
      component.email = 'merchant@example.com';
      component.password = 'PASSWORD1';

      component.signup();

      expect(component.errorMessage).toBe('Password must contain at least one lowercase letter.');

      expect(authServiceMock.registerMerchant).not.toHaveBeenCalled();
    });

    it('should reject password without number', () => {
      component.username = 'merchant01';
      component.email = 'merchant@example.com';
      component.password = 'Password';

      component.signup();

      expect(component.errorMessage).toBe('Password must contain at least one number.');

      expect(authServiceMock.registerMerchant).not.toHaveBeenCalled();
    });
  });

  // =========================================================
  // STEP 1 - SUCCESS
  // =========================================================

  describe('merchant registration - step 1 success', () => {
    it('should register merchant account successfully', () => {
      component.username = '  merchant01  ';

      component.email = '  merchant@example.com  ';

      component.password = 'Password1';

      authServiceMock.registerMerchant.mockReturnValue(
        of({
          token: 'merchant-jwt-token',

          userId: 2,

          username: 'merchant01',

          email: 'merchant@example.com',

          role: 'MERCHANT',
        }),
      );

      component.signup();

      expect(authServiceMock.registerMerchant).toHaveBeenCalledTimes(1);

      expect(authServiceMock.registerMerchant).toHaveBeenCalledWith({
        username: 'merchant01',

        email: 'merchant@example.com',

        password: 'Password1',
      });

      expect(component.loading).toBe(false);

      expect(component.signupStep).toBe(2);
    });

    it('should save merchant user ID to localStorage', () => {
      component.username = 'merchant01';

      component.email = 'merchant@example.com';

      component.password = 'Password1';

      authServiceMock.registerMerchant.mockReturnValue(
        of({
          token: 'merchant-jwt-token',

          userId: 2,

          username: 'merchant01',

          email: 'merchant@example.com',

          role: 'MERCHANT',
        }),
      );

      component.signup();

      expect(localStorage.getItem('pendingMerchantUserId')).toBe('2');
    });

    it('should save token to localStorage', () => {
      component.username = 'merchant01';

      component.email = 'merchant@example.com';

      component.password = 'Password1';

      authServiceMock.registerMerchant.mockReturnValue(
        of({
          token: 'merchant-jwt-token',

          userId: 2,

          username: 'merchant01',

          email: 'merchant@example.com',

          role: 'MERCHANT',
        }),
      );

      component.signup();

      expect(localStorage.getItem('token')).toBe('merchant-jwt-token');
    });

    it('should save username, email and role to localStorage', () => {
      component.username = 'merchant01';

      component.email = 'merchant@example.com';

      component.password = 'Password1';

      authServiceMock.registerMerchant.mockReturnValue(
        of({
          token: 'merchant-jwt-token',

          userId: 2,

          username: 'merchant01',

          email: 'merchant@example.com',

          role: 'MERCHANT',
        }),
      );

      component.signup();

      expect(localStorage.getItem('username')).toBe('merchant01');

      expect(localStorage.getItem('email')).toBe('merchant@example.com');

      expect(localStorage.getItem('role')).toBe('MERCHANT');
    });

    it('should accept id instead of userId', () => {
      component.username = 'merchant01';

      component.email = 'merchant@example.com';

      component.password = 'Password1';

      authServiceMock.registerMerchant.mockReturnValue(
        of({
          token: 'merchant-jwt-token',

          id: 5,

          username: 'merchant01',

          email: 'merchant@example.com',

          role: 'MERCHANT',
        }),
      );

      component.signup();

      expect(localStorage.getItem('pendingMerchantUserId')).toBe('5');

      expect(component.signupStep).toBe(2);
    });

    it('should display error when backend does not return user ID', () => {
      component.username = 'merchant01';

      component.email = 'merchant@example.com';

      component.password = 'Password1';

      authServiceMock.registerMerchant.mockReturnValue(
        of({
          token: 'merchant-jwt-token',

          username: 'merchant01',

          email: 'merchant@example.com',

          role: 'MERCHANT',
        }),
      );

      component.signup();

      expect(component.errorMessage).toBe('Account was created, but the user ID was not returned.');

      expect(component.signupStep).toBe(1);
    });

    it('should not save token when backend does not return token', () => {
      component.username = 'merchant01';
      component.email = 'merchant@example.com';
      component.password = 'Password1';

      authServiceMock.registerMerchant.mockReturnValue(
        of({
          userId: 2,
          username: 'merchant01',
          email: 'merchant@example.com',
          role: 'MERCHANT',
        }),
      );

      component.signup();

      expect(localStorage.getItem('token')).toBeNull();
      expect(component.signupStep).toBe(2);
    });
  });

  // =========================================================
  // STEP 1 - ERROR
  // =========================================================

  describe('merchant registration - step 1 error', () => {
    it('should display backend error message', () => {
      component.username = 'merchant01';

      component.email = 'merchant@example.com';

      component.password = 'Password1';

      authServiceMock.registerMerchant.mockReturnValue(
        throwError(() => ({
          error: 'Email is already registered',
        })),
      );

      component.signup();

      expect(component.loading).toBe(false);

      expect(component.errorMessage).toBe('Email is already registered');
    });

    it('should display message from error.message', () => {
      component.username = 'merchant01';

      component.email = 'merchant@example.com';

      component.password = 'Password1';

      authServiceMock.registerMerchant.mockReturnValue(
        throwError(() => ({
          error: {
            message: 'Email already exists',
          },
        })),
      );

      component.signup();

      expect(component.errorMessage).toBe('Email already exists');
    });

    it('should display duplicate message for HTTP 409', () => {
      component.username = 'merchant01';

      component.email = 'merchant@example.com';

      component.password = 'Password1';

      authServiceMock.registerMerchant.mockReturnValue(
        throwError(() => ({
          status: 409,
        })),
      );

      component.signup();

      expect(component.errorMessage).toBe('Username or email is already registered.');
    });
  });

  // =========================================================
  // LOGO VALIDATION
  // =========================================================

  describe('onLogoSelected', () => {
    it('should do nothing when no file is selected', () => {
      const input = document.createElement('input');

      input.type = 'file';

      const event = {
        target: input,
      } as unknown as Event;

      component.onLogoSelected(event);

      expect(component.logoFile).toBeNull();
    });

    it('should reject a non-image file', () => {
      const file = new File(['hello'], 'document.pdf', {
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

      component.onLogoSelected(event);

      expect(component.errorMessage).toBe('Please select a valid image for your business logo.');

      expect(component.logoFile).toBeNull();

      expect(component.logoPreview).toBeNull();
    });

    it('should reject logo larger than 2 MB', () => {
      const largeFile = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'logo.png', {
        type: 'image/png',
      });

      const input = document.createElement('input');

      input.type = 'file';

      Object.defineProperty(input, 'files', {
        value: [largeFile],
      });

      const event = {
        target: input,
      } as unknown as Event;

      component.onLogoSelected(event);

      expect(component.errorMessage).toBe('Business logo must be smaller than 2 MB.');

      expect(component.logoFile).toBeNull();
    });
  });

  // =========================================================
  // BUSINESS DOCUMENT VALIDATION
  // =========================================================

  describe('onDocumentSelected', () => {
    it('should do nothing when no document is selected', () => {
      const input = document.createElement('input');

      input.type = 'file';

      const event = {
        target: input,
      } as unknown as Event;

      component.onDocumentSelected(event);

      expect(component.businessDocument).toBeNull();
    });

    it('should reject unsupported document type', () => {
      const file = new File(['hello'], 'document.txt', {
        type: 'text/plain',
      });

      const input = document.createElement('input');

      input.type = 'file';

      Object.defineProperty(input, 'files', {
        value: [file],
      });

      const event = {
        target: input,
      } as unknown as Event;

      component.onDocumentSelected(event);

      expect(component.errorMessage).toBe('Please upload a PDF, JPG or PNG document.');

      expect(component.businessDocument).toBeNull();
    });

    it('should reject document larger than 5 MB', () => {
      const largeFile = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'registration.pdf', {
        type: 'application/pdf',
      });

      const input = document.createElement('input');

      input.type = 'file';

      Object.defineProperty(input, 'files', {
        value: [largeFile],
      });

      const event = {
        target: input,
      } as unknown as Event;

      component.onDocumentSelected(event);

      expect(component.errorMessage).toBe(
        'Business registration document must be smaller than 5 MB.',
      );

      expect(component.businessDocument).toBeNull();
    });
  });

  // =========================================================
  // STEP 2 VALIDATION
  // =========================================================

  describe('step 2 validation', () => {
    beforeEach(() => {
      component.signupStep = 2;

      localStorage.setItem('pendingMerchantUserId', '2');
    });

    it('should require business name', () => {
      component.businessName = '';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your business or shop name.');

      expect(authServiceMock.createMerchantProfile).not.toHaveBeenCalled();
    });

    it('should require UEN', () => {
      component.businessName = 'SmartCart Fashion';

      component.uen = '';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your UEN or business registration number.');

      expect(authServiceMock.createMerchantProfile).not.toHaveBeenCalled();
    });

    it('should require business type', () => {
      component.businessName = 'SmartCart Fashion';

      component.uen = '202612345A';

      component.businessType = '';

      component.signup();

      expect(component.errorMessage).toBe('Please select your business type.');
    });

    it('should require business address', () => {
      component.businessName = 'SmartCart Fashion';

      component.uen = '202612345A';

      component.businessType = 'Retail';

      component.businessAddress = '';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your business address.');
    });

    it('should require postal code', () => {
      component.businessName = 'SmartCart Fashion';

      component.uen = '202612345A';

      component.businessType = 'Retail';

      component.businessAddress = '12 Rainbow Street';

      component.postalCode = '';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your postal code.');
    });

    it('should require contact number', () => {
      component.businessName = 'SmartCart Fashion';

      component.uen = '202612345A';

      component.businessType = 'Retail';

      component.businessAddress = '12 Rainbow Street';

      component.postalCode = '123456';

      component.contactNumber = '';

      component.signup();

      expect(component.errorMessage).toBe('Please enter your contact number.');
    });

    it('should require product category', () => {
      component.businessName = 'SmartCart Fashion';

      component.uen = '202612345A';

      component.businessType = 'Retail';

      component.businessAddress = '12 Rainbow Street';

      component.postalCode = '123456';

      component.contactNumber = '91234567';

      component.productCategory = '';

      component.signup();

      expect(component.errorMessage).toBe('Please select your product category.');
    });

    it('should require business description', () => {
      component.businessName = 'SmartCart Fashion';

      component.uen = '202612345A';

      component.businessType = 'Retail';

      component.businessAddress = '12 Rainbow Street';

      component.postalCode = '123456';

      component.contactNumber = '91234567';

      component.productCategory = 'Fashion';

      component.businessDescription = '';

      component.signup();

      expect(component.errorMessage).toBe('Please enter a description of your business.');
    });

    it('should require business registration document', () => {
      component.businessName = 'SmartCart Fashion';

      component.uen = '202612345A';

      component.businessType = 'Retail';

      component.businessAddress = '12 Rainbow Street';

      component.postalCode = '123456';

      component.contactNumber = '91234567';

      component.productCategory = 'Fashion';

      component.businessDescription = 'Fashion retailer in Singapore.';

      component.businessDocument = null;

      component.signup();

      expect(component.errorMessage).toBe('Please upload your business registration document.');

      expect(authServiceMock.createMerchantProfile).not.toHaveBeenCalled();
    });

    it('should require valid pending merchant user ID', () => {
      localStorage.removeItem('pendingMerchantUserId');

      component.businessName = 'SmartCart Fashion';

      component.uen = '202612345A';

      component.businessType = 'Retail';

      component.businessAddress = '12 Rainbow Street';

      component.postalCode = '123456';

      component.contactNumber = '91234567';

      component.productCategory = 'Fashion';

      component.businessDescription = 'Fashion retailer in Singapore.';

      component.businessDocument = new File(['document'], 'registration.pdf', {
        type: 'application/pdf',
      });

      component.signup();

      expect(component.errorMessage).toBe(
        'Your registration session has expired. Please start again.',
      );

      expect(authServiceMock.createMerchantProfile).not.toHaveBeenCalled();
    });
  });

  // =========================================================
  // STEP 2 SUCCESS
  // =========================================================

  describe('step 2 submission', () => {
    beforeEach(() => {
      component.signupStep = 2;

      component.businessName = '  SmartCart Fashion  ';

      component.uen = ' 202612345A ';

      component.businessType = 'Retail';

      component.businessAddress = ' 12 Rainbow Street ';

      component.postalCode = ' 123456 ';

      component.contactNumber = ' 91234567 ';

      component.productCategory = 'Fashion';

      component.businessDescription = ' Fashion retailer in Singapore. ';

      component.pickupAvailable = true;

      component.businessDocument = new File(['registration document'], 'registration.pdf', {
        type: 'application/pdf',
      });

      component.logoFile = new File(['logo'], 'logo.png', {
        type: 'image/png',
      });

      localStorage.setItem('pendingMerchantUserId', '2');
    });

    it('should create merchant profile successfully', () => {
      authServiceMock.createMerchantProfile.mockReturnValue(
        of({
          id: 10,

          businessName: 'SmartCart Fashion',
        }),
      );

      component.signup();

      expect(authServiceMock.createMerchantProfile).toHaveBeenCalledTimes(1);

      expect(authServiceMock.createMerchantProfile).toHaveBeenCalledWith(
        2,

        'SmartCart Fashion',

        '202612345A',

        'Retail',

        '12 Rainbow Street',

        '123456',

        '91234567',

        'Fashion',

        'Fashion retailer in Singapore.',

        true,

        component.logoFile,

        component.businessDocument,
      );

      expect(component.loading).toBe(false);

      expect(component.errorMessage).toBe('');

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);

      expect(localStorage.getItem('pendingMerchantUserId')).toBeNull();
    });

    it('should create merchant profile successfully without logo', () => {
      component.logoFile = null;

      authServiceMock.createMerchantProfile.mockReturnValue(
        of({
          id: 10,

          businessName: 'SmartCart Fashion',
        }),
      );

      component.signup();

      expect(authServiceMock.createMerchantProfile).toHaveBeenCalledWith(
        2,

        'SmartCart Fashion',

        '202612345A',

        'Retail',

        '12 Rainbow Street',

        '123456',

        '91234567',

        'Fashion',

        'Fashion retailer in Singapore.',

        true,

        null,

        component.businessDocument,
      );

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should display backend error when merchant profile creation fails', () => {
      authServiceMock.createMerchantProfile.mockReturnValue(
        throwError(() => ({
          error: 'Invalid registration document',
        })),
      );

      component.signup();

      expect(component.loading).toBe(false);

      expect(component.errorMessage).toBe('Invalid registration document');

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should handle merchant profile error with message object', () => {
      authServiceMock.createMerchantProfile.mockReturnValue(
        throwError(() => ({
          error: {
            message: 'Business document is invalid',
          },
        })),
      );

      component.signup();

      expect(component.errorMessage).toBe('Business document is invalid');

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  // =========================================================
  // BACK TO STEP 1
  // =========================================================

  describe('backToStep1', () => {
    it('should return to step 1', () => {
      component.signupStep = 2;

      component.errorMessage = 'Some error';

      component.loading = true;

      component.backToStep1();

      expect(component.signupStep).toBe(1);

      expect(component.errorMessage).toBe('');

      expect(component.loading).toBe(false);
    });
  });

  // =========================================================
  // DOCUMENT VALID TYPES
  // =========================================================

  describe('valid business documents', () => {
    it('should accept PDF document', () => {
      const file = new File(['pdf content'], 'registration.pdf', {
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

      component.onDocumentSelected(event);

      expect(component.businessDocument).not.toBeNull();

      expect(component.businessDocument?.type).toBe('application/pdf');

      expect(component.businessDocument?.name).toMatch(/^merchant-document-\d+\.pdf$/);
    });

    it('should accept PNG document', () => {
      const file = new File(['png content'], 'registration.png', {
        type: 'image/png',
      });

      const input = document.createElement('input');

      input.type = 'file';

      Object.defineProperty(input, 'files', {
        value: [file],
      });

      const event = {
        target: input,
      } as unknown as Event;

      component.onDocumentSelected(event);

      expect(component.businessDocument).not.toBeNull();

      expect(component.businessDocument?.name).toMatch(/^merchant-document-\d+\.png$/);
    });
  });

  // =========================================================
  // VALID LOGO
  // =========================================================

  describe('valid logo', () => {
    it('should accept PNG logo', () => {
      const file = new File(['png content'], 'logo.png', {
        type: 'image/png',
      });

      const input = document.createElement('input');

      input.type = 'file';

      Object.defineProperty(input, 'files', {
        value: [file],
      });

      const event = {
        target: input,
      } as unknown as Event;

      component.onLogoSelected(event);

      expect(component.logoFile).not.toBeNull();

      expect(component.logoFile?.type).toBe('image/png');

      expect(component.logoFile?.name).toMatch(/^merchant-logo-\d+\.png$/);

      expect(component.errorMessage).toBe('');
    });
  });
});
