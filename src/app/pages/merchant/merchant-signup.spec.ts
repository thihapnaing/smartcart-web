import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MerchantSignup } from './merchant-signup';
import { AuthService } from '../../services/auth.service';

describe('MerchantSignup', () => {
  let component: MerchantSignup;
  let authService: {
    registerMerchant: ReturnType<typeof vi.fn>;
    createMerchantProfile: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };
  let cdr: { detectChanges: ReturnType<typeof vi.fn> };

  const validStep1 = {
    username: 'merchant01',
    email: 'merchant@example.com',
    password: 'Password1',
  };

  const validStep2 = {
    businessName: 'SmartCart Fashion',
    uen: '202612345A',
    businessType: 'Retail',
    businessAddress: '12 Rainbow Street',
    postalCode: '123456',
    contactNumber: '91234567',
    productCategory: 'Fashion',
    businessDescription: 'Fashion retailer in Singapore.',
    pickupAvailable: true,
  };

  const makeDocument = () =>
    new File(['registration'], 'registration.pdf', {
      type: 'application/pdf',
    });

  const makeLogo = () =>
    new File(['logo'], 'logo.png', {
      type: 'image/png',
    });

  beforeEach(() => {
    localStorage.clear();

    routerMock = {
      navigate: vi.fn(),
    };

    authService = {
      registerMerchant: vi.fn(),
      createMerchantProfile: vi.fn(),
    };

    cdr = { detectChanges: vi.fn() };

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    component = new MerchantSignup(
      authService as unknown as AuthService,
      routerMock as unknown as Router,
      cdr as unknown as ChangeDetectorRef,
    );
  });

  // =========================================================
  // INITIAL STATE
  // =========================================================

  it('should create the component', () => {
    expect(component).toBeTruthy();
    expect(component.signupStep).toBe(1);
  });

  it('should initialize fields correctly', () => {
    expect(component.username).toBe('');
    expect(component.email).toBe('');
    expect(component.password).toBe('');
    expect(component.businessName).toBe('');
    expect(component.uen).toBe('');
    expect(component.businessType).toBe('');
    expect(component.businessAddress).toBe('');
    expect(component.postalCode).toBe('');
    expect(component.contactNumber).toBe('');
    expect(component.productCategory).toBe('');
    expect(component.businessDescription).toBe('');
    expect(component.pickupAvailable).toBe(false);
    expect(component.logoFile).toBeNull();
    expect(component.logoPreview).toBeNull();
    expect(component.businessDocument).toBeNull();
    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe('');
  });

  // =========================================================
  // PASSWORD
  // =========================================================

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBe(false);

    component.togglePassword();
    expect(component.showPassword).toBe(true);

    component.togglePassword();
    expect(component.showPassword).toBe(false);
  });

  // =========================================================
  // STEP 1 VALIDATION
  // =========================================================

  it('should reject an empty username', () => {
    component.email = validStep1.email;
    component.password = validStep1.password;

    component.signup();

    expect(component.errorMessage).toBe('Please enter your username.');
    expect(authService.registerMerchant).not.toHaveBeenCalled();
  });

  it('should reject a short username', () => {
    component.username = 'ab';
    component.email = validStep1.email;
    component.password = validStep1.password;

    component.signup();

    expect(component.errorMessage).toBe('Username must be at least 3 characters.');
  });

  it('should reject an empty email', () => {
    component.username = validStep1.username;
    component.password = validStep1.password;

    component.signup();

    expect(component.errorMessage).toBe('Please enter your email.');
  });

  it('should reject an invalid email', () => {
    component.username = validStep1.username;
    component.email = 'invalid-email';
    component.password = validStep1.password;

    component.signup();

    expect(component.errorMessage).toBe('Please enter a valid email address.');
  });

  it('should reject an email containing spaces', () => {
    component.username = validStep1.username;
    component.email = 'merchant @example.com';
    component.password = validStep1.password;

    component.signup();

    expect(component.errorMessage).toBe('Please enter a valid email address.');
  });

  it('should reject an empty password', () => {
    component.username = validStep1.username;
    component.email = validStep1.email;

    component.signup();

    expect(component.errorMessage).toBe('Please enter your password.');
  });

  it('should reject a password shorter than 6 characters', () => {
    component.username = validStep1.username;
    component.email = validStep1.email;
    component.password = 'Ab1';

    component.signup();

    expect(component.errorMessage).toBe('Password must be at least 6 characters.');
  });

  it('should reject a password without uppercase', () => {
    component.username = validStep1.username;
    component.email = validStep1.email;
    component.password = 'password1';

    component.signup();

    expect(component.errorMessage).toBe('Password must contain at least one uppercase letter.');
  });

  it('should reject a password without lowercase', () => {
    component.username = validStep1.username;
    component.email = validStep1.email;
    component.password = 'PASSWORD1';

    component.signup();

    expect(component.errorMessage).toBe('Password must contain at least one lowercase letter.');
  });

  it('should reject a password without a number', () => {
    component.username = validStep1.username;
    component.email = validStep1.email;
    component.password = 'Password';

    component.signup();

    expect(component.errorMessage).toBe('Password must contain at least one number.');
  });

  it('should register a valid merchant account', () => {
    authService.registerMerchant.mockReturnValue(
      of({
        userId: 2,
        username: 'merchant01',
        email: 'merchant@example.com',
        role: 'MERCHANT',
        token: 'jwt-token',
      }),
    );

    component.username = '  merchant01 ';
    component.email = ' merchant@example.com ';
    component.password = 'Password1';

    component.signup();

    expect(authService.registerMerchant).toHaveBeenCalledWith({
      username: 'merchant01',
      email: 'merchant@example.com',
      password: 'Password1',
    });

    expect(component.signupStep).toBe(2);
    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe('');

    expect(localStorage.getItem('pendingMerchantUserId')).toBe('2');
    expect(localStorage.getItem('token')).toBe('jwt-token');
    expect(localStorage.getItem('username')).toBe('merchant01');
    expect(localStorage.getItem('email')).toBe('merchant@example.com');
    expect(localStorage.getItem('role')).toBe('MERCHANT');
  });

  it('should accept response.id when userId is missing', () => {
    authService.registerMerchant.mockReturnValue(of({ id: 5 }));

    component.username = validStep1.username;
    component.email = validStep1.email;
    component.password = validStep1.password;

    component.signup();

    expect(component.signupStep).toBe(2);
    expect(localStorage.getItem('pendingMerchantUserId')).toBe('5');
  });

  it('should show an error when registration returns no user ID', () => {
    authService.registerMerchant.mockReturnValue(of({ username: 'merchant01' }));

    component.username = validStep1.username;
    component.email = validStep1.email;
    component.password = validStep1.password;

    component.signup();

    expect(component.signupStep).toBe(1);
    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe('Account was created, but the user ID was not returned.');
  });

  // =========================================================
  // STEP 1 ERRORS
  // =========================================================

  it('should handle a plain registration error', () => {
    authService.registerMerchant.mockReturnValue(
      throwError(() => ({ error: 'Registration failed.' })),
    );

    component.username = validStep1.username;
    component.email = validStep1.email;
    component.password = validStep1.password;

    component.signup();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe('Registration failed.');
  });

  it('should handle error.message', () => {
    authService.registerMerchant.mockReturnValue(
      throwError(() => ({
        error: { message: 'Email already exists.' },
      })),
    );

    component.username = validStep1.username;
    component.email = validStep1.email;
    component.password = validStep1.password;

    component.signup();

    expect(component.errorMessage).toBe('Email already exists.');
  });

  it('should handle error.error', () => {
    authService.registerMerchant.mockReturnValue(
      throwError(() => ({
        error: { error: 'Username already exists.' },
      })),
    );

    component.username = validStep1.username;
    component.email = validStep1.email;
    component.password = validStep1.password;

    component.signup();

    expect(component.errorMessage).toBe('Username already exists.');
  });

  it('should handle error.detail', () => {
    authService.registerMerchant.mockReturnValue(
      throwError(() => ({
        error: { detail: 'Invalid merchant data.' },
      })),
    );

    component.username = validStep1.username;
    component.email = validStep1.email;
    component.password = validStep1.password;

    component.signup();

    expect(component.errorMessage).toBe('Invalid merchant data.');
  });

  it('should handle HTTP 409', () => {
    authService.registerMerchant.mockReturnValue(throwError(() => ({ status: 409 })));

    component.username = validStep1.username;
    component.email = validStep1.email;
    component.password = validStep1.password;

    component.signup();

    expect(component.errorMessage).toBe('Username or email is already registered.');
  });

  it('should use the default registration error', () => {
    authService.registerMerchant.mockReturnValue(throwError(() => ({ status: 500, error: {} })));

    component.username = validStep1.username;
    component.email = validStep1.email;
    component.password = validStep1.password;

    component.signup();

    expect(component.errorMessage).toBe('Unable to create merchant account. Please try again.');
  });

  // =========================================================
  // LOGO
  // =========================================================

  function fileInput(file: File | null): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';

    if (file) {
      Object.defineProperty(input, 'files', {
        configurable: true,
        value: [file],
      });
    }

    return input;
  }

  it('should do nothing when no logo is selected', () => {
    component.onLogoSelected({
      target: fileInput(null),
    } as unknown as Event);

    expect(component.logoFile).toBeNull();
  });

  it('should reject a non-image logo', () => {
    const input = fileInput(new File(['pdf'], 'logo.pdf', { type: 'application/pdf' }));

    component.onLogoSelected({
      target: input,
    } as unknown as Event);

    expect(component.logoFile).toBeNull();
    expect(component.logoPreview).toBeNull();
    expect(component.errorMessage).toBe('Please select a valid image for your business logo.');
  });

  it('should reject a logo larger than 2 MB', () => {
    const input = fileInput(
      new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'logo.png', { type: 'image/png' }),
    );

    component.onLogoSelected({
      target: input,
    } as unknown as Event);

    expect(component.logoFile).toBeNull();
    expect(component.errorMessage).toBe('Business logo must be smaller than 2 MB.');
  });

  it('should create a safe logo filename', () => {
    const originalNow = Date.now;
    Date.now = () => 123456;

    try {
      component.onLogoSelected({
        target: fileInput(
          new File(['logo'], 'my-logo.png', {
            type: 'image/png',
          }),
        ),
      } as unknown as Event);
    } finally {
      Date.now = originalNow;
    }

    expect(component.logoFile).toBeInstanceOf(File);
    expect(component.logoFile?.name).toBe('merchant-logo-123456.png');
    expect(component.logoFile?.type).toBe('image/png');
    expect(component.errorMessage).toBe('');
  });

  // =========================================================
  // DOCUMENT
  // =========================================================

  it('should do nothing when no document is selected', () => {
    component.onDocumentSelected({
      target: fileInput(null),
    } as unknown as Event);

    expect(component.businessDocument).toBeNull();
  });

  it('should accept a PDF document', () => {
    const originalNow = Date.now;
    Date.now = () => 123456;

    try {
      component.onDocumentSelected({
        target: fileInput(makeDocument()),
      } as unknown as Event);
    } finally {
      Date.now = originalNow;
    }

    expect(component.businessDocument).toBeInstanceOf(File);
    expect(component.businessDocument?.name).toBe('merchant-document-123456.pdf');
    expect(component.businessDocument?.type).toBe('application/pdf');
  });

  it('should accept a JPG document', () => {
    const originalNow = Date.now;
    Date.now = () => 222222;

    try {
      component.onDocumentSelected({
        target: fileInput(
          new File(['jpg'], 'registration.jpg', {
            type: 'image/jpeg',
          }),
        ),
      } as unknown as Event);
    } finally {
      Date.now = originalNow;
    }

    expect(component.businessDocument?.name).toBe('merchant-document-222222.jpg');
  });

  it('should accept a PNG document', () => {
    const originalNow = Date.now;
    Date.now = () => 333333;

    try {
      component.onDocumentSelected({
        target: fileInput(
          new File(['png'], 'registration.png', {
            type: 'image/png',
          }),
        ),
      } as unknown as Event);
    } finally {
      Date.now = originalNow;
    }

    expect(component.businessDocument?.name).toBe('merchant-document-333333.png');
  });

  it('should reject an unsupported document type', () => {
    component.onDocumentSelected({
      target: fileInput(
        new File(['text'], 'registration.txt', {
          type: 'text/plain',
        }),
      ),
    } as unknown as Event);

    expect(component.businessDocument).toBeNull();
    expect(component.errorMessage).toBe('Please upload a PDF, JPG or PNG document.');
  });

  it('should reject a document larger than 5 MB', () => {
    component.onDocumentSelected({
      target: fileInput(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'registration.pdf', {
          type: 'application/pdf',
        }),
      ),
    } as unknown as Event);

    expect(component.businessDocument).toBeNull();
    expect(component.errorMessage).toBe(
      'Business registration document must be smaller than 5 MB.',
    );
  });

  // =========================================================
  // STEP 2 VALIDATION
  // =========================================================

  function prepareStep2(): void {
    component.signupStep = 2;

    component.businessName = validStep2.businessName;
    component.uen = validStep2.uen;
    component.businessType = validStep2.businessType;
    component.businessAddress = validStep2.businessAddress;
    component.postalCode = validStep2.postalCode;
    component.contactNumber = validStep2.contactNumber;
    component.productCategory = validStep2.productCategory;
    component.businessDescription = validStep2.businessDescription;
    component.pickupAvailable = validStep2.pickupAvailable;
    component.businessDocument = makeDocument();

    localStorage.setItem('pendingMerchantUserId', '2');
  }

  it('should reject an empty business name', () => {
    prepareStep2();
    component.businessName = '';

    component.signup();

    expect(component.errorMessage).toBe('Please enter your business or shop name.');
    expect(authService.createMerchantProfile).not.toHaveBeenCalled();
  });

  it('should reject an empty UEN', () => {
    prepareStep2();
    component.uen = '';

    component.signup();

    expect(component.errorMessage).toBe('Please enter your UEN or business registration number.');
  });

  it('should reject an empty business type', () => {
    prepareStep2();
    component.businessType = '';

    component.signup();

    expect(component.errorMessage).toBe('Please select your business type.');
  });

  it('should reject an empty business address', () => {
    prepareStep2();
    component.businessAddress = '';

    component.signup();

    expect(component.errorMessage).toBe('Please enter your business address.');
  });

  it('should reject an empty postal code', () => {
    prepareStep2();
    component.postalCode = '';

    component.signup();

    expect(component.errorMessage).toBe('Please enter your postal code.');
  });

  it('should reject an empty contact number', () => {
    prepareStep2();
    component.contactNumber = '';

    component.signup();

    expect(component.errorMessage).toBe('Please enter your contact number.');
  });

  it('should reject an empty product category', () => {
    prepareStep2();
    component.productCategory = '';

    component.signup();

    expect(component.errorMessage).toBe('Please select your product category.');
  });

  it('should reject an empty business description', () => {
    prepareStep2();
    component.businessDescription = '';

    component.signup();

    expect(component.errorMessage).toBe('Please enter a description of your business.');
  });

  it('should reject a missing registration document', () => {
    prepareStep2();
    component.businessDocument = null;

    component.signup();

    expect(component.errorMessage).toBe('Please upload your business registration document.');
  });

  it('should reject a missing pending user ID', () => {
    prepareStep2();
    localStorage.removeItem('pendingMerchantUserId');

    component.signup();

    expect(component.errorMessage).toBe(
      'Your registration session has expired. Please start again.',
    );
    expect(authService.createMerchantProfile).not.toHaveBeenCalled();
  });

  it('should reject a non-numeric pending user ID', () => {
    prepareStep2();
    localStorage.setItem('pendingMerchantUserId', 'abc');

    component.signup();

    expect(component.errorMessage).toBe(
      'Your registration session has expired. Please start again.',
    );
  });

  // =========================================================
  // STEP 2 SUCCESS
  // =========================================================

  it('should create merchant profile successfully', () => {
    prepareStep2();
    component.logoFile = makeLogo();

    authService.createMerchantProfile.mockReturnValue(of({ success: true }));

    component.signup();

    expect(authService.createMerchantProfile).toHaveBeenCalledWith({
      userId: 2,
      businessName: 'SmartCart Fashion',
      uen: '202612345A',
      businessType: 'Retail',
      businessAddress: '12 Rainbow Street',
      postalCode: '123456',
      contactNumber: '91234567',
      productCategory: 'Fashion',
      businessDescription: 'Fashion retailer in Singapore.',
      pickupAvailable: true,
      logoFile: component.logoFile,
      registrationDocument: component.businessDocument,
    });

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe('');
    expect(localStorage.getItem('pendingMerchantUserId')).toBeNull();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should create merchant profile without a logo', () => {
    prepareStep2();
    component.logoFile = null;

    authService.createMerchantProfile.mockReturnValue(of({ success: true }));

    component.signup();

    expect(authService.createMerchantProfile).toHaveBeenCalledWith({
      userId: 2,
      businessName: 'SmartCart Fashion',
      uen: '202612345A',
      businessType: 'Retail',
      businessAddress: '12 Rainbow Street',
      postalCode: '123456',
      contactNumber: '91234567',
      productCategory: 'Fashion',
      businessDescription: 'Fashion retailer in Singapore.',
      pickupAvailable: true,
      logoFile: null,
      registrationDocument: component.businessDocument,
    });
  });

  it('should trim business text fields before submission', () => {
    prepareStep2();

    component.businessName = ' SmartCart Fashion ';
    component.uen = ' 202612345A ';
    component.businessAddress = ' 12 Rainbow Street ';
    component.postalCode = ' 123456 ';
    component.contactNumber = ' 91234567 ';
    component.businessDescription = ' Fashion retailer in Singapore. ';

    authService.createMerchantProfile.mockReturnValue(of({ success: true }));

    component.signup();

    expect(authService.createMerchantProfile).toHaveBeenCalledWith({
      userId: 2,
      businessName: 'SmartCart Fashion',
      uen: '202612345A',
      businessType: 'Retail',
      businessAddress: '12 Rainbow Street',
      postalCode: '123456',
      contactNumber: '91234567',
      productCategory: 'Fashion',
      businessDescription: 'Fashion retailer in Singapore.',
      pickupAvailable: true,
      logoFile: null,
      registrationDocument: component.businessDocument,
    });
  });

  // =========================================================
  // STEP 2 ERROR
  // =========================================================

  it('should handle merchant profile error', () => {
    prepareStep2();

    authService.createMerchantProfile.mockReturnValue(
      throwError(() => ({
        error: { message: 'UEN is already registered.' },
      })),
    );

    component.signup();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe('UEN is already registered.');
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(localStorage.getItem('pendingMerchantUserId')).toBe('2');
  });

  it('should use the default merchant profile error', () => {
    prepareStep2();

    authService.createMerchantProfile.mockReturnValue(
      throwError(() => ({
        status: 500,
        error: {},
      })),
    );

    component.signup();

    expect(component.errorMessage).toBe('Unable to submit merchant application. Please try again.');
  });

  // =========================================================
  // BACK TO STEP 1
  // =========================================================

  it('should return to step 1', () => {
    component.signupStep = 2;
    component.loading = true;
    component.errorMessage = 'Some error';

    component.backToStep1();

    expect(component.signupStep).toBe(1);
    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe('');
    expect(cdr.detectChanges).toHaveBeenCalled();
  });
});
