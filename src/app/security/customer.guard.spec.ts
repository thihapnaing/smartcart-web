import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { customerGuard } from './customer.guard';
import { AuthService } from '../services/auth.service';

describe('customerGuard', () => {
  let authService: {
    isLoggedIn: ReturnType<typeof vi.fn>;
    getRole: ReturnType<typeof vi.fn>;
  };

  let router: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authService = {
      isLoggedIn: vi.fn(),
      getRole: vi.fn(),
    };

    router = {
      createUrlTree: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
    });
  });

  // =========================================================
  // NOT LOGGED IN
  // =========================================================

  it('should redirect to login when user is not logged in', () => {
    authService.isLoggedIn.mockReturnValue(false);

    const urlTree = {} as UrlTree;

    router.createUrlTree.mockReturnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => customerGuard({} as never, {} as never));

    expect(authService.isLoggedIn).toHaveBeenCalledTimes(1);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);

    expect(result).toBe(urlTree);
  });

  // =========================================================
  // CUSTOMER
  // =========================================================

  it('should allow CUSTOMER to access the page', () => {
    authService.isLoggedIn.mockReturnValue(true);

    authService.getRole.mockReturnValue('CUSTOMER');

    const result = TestBed.runInInjectionContext(() => customerGuard({} as never, {} as never));

    expect(authService.isLoggedIn).toHaveBeenCalledTimes(1);

    expect(authService.getRole).toHaveBeenCalledTimes(1);

    expect(router.createUrlTree).not.toHaveBeenCalled();

    expect(result).toBe(true);
  });

  // =========================================================
  // MERCHANT
  // =========================================================

  it('should redirect MERCHANT to login', () => {
    authService.isLoggedIn.mockReturnValue(true);

    authService.getRole.mockReturnValue('MERCHANT');

    const urlTree = {} as UrlTree;

    router.createUrlTree.mockReturnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => customerGuard({} as never, {} as never));

    expect(authService.getRole).toHaveBeenCalledTimes(1);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: {
        message: 'You are merchant, not allowed to use it.',
      },
    });

    expect(result).toBe(urlTree);
  });

  // =========================================================
  // USER
  // =========================================================

  it('should redirect USER to login', () => {
    authService.isLoggedIn.mockReturnValue(true);

    authService.getRole.mockReturnValue('USER');

    const urlTree = {} as UrlTree;

    router.createUrlTree.mockReturnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => customerGuard({} as never, {} as never));

    expect(authService.getRole).toHaveBeenCalledTimes(1);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: {
        message: 'You are not allowed to use this page.',
      },
    });

    expect(result).toBe(urlTree);
  });

  // =========================================================
  // ADMIN
  // =========================================================

  it('should redirect ADMIN to login', () => {
    authService.isLoggedIn.mockReturnValue(true);

    authService.getRole.mockReturnValue('ADMIN');

    const urlTree = {} as UrlTree;

    router.createUrlTree.mockReturnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => customerGuard({} as never, {} as never));

    expect(authService.getRole).toHaveBeenCalledTimes(1);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: {
        message: 'You are not allowed to use this page.',
      },
    });

    expect(result).toBe(urlTree);
  });

  // =========================================================
  // UNKNOWN ROLE
  // =========================================================

  it('should redirect unknown role to login', () => {
    authService.isLoggedIn.mockReturnValue(true);

    authService.getRole.mockReturnValue('UNKNOWN');

    const urlTree = {} as UrlTree;

    router.createUrlTree.mockReturnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => customerGuard({} as never, {} as never));

    expect(authService.getRole).toHaveBeenCalledTimes(1);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: {
        message: 'You are not allowed to use this page.',
      },
    });

    expect(result).toBe(urlTree);
  });

  // =========================================================
  // VERIFY MERCHANT MESSAGE
  // =========================================================

  it('should include the correct merchant error message', () => {
    authService.isLoggedIn.mockReturnValue(true);

    authService.getRole.mockReturnValue('MERCHANT');

    const urlTree = {} as UrlTree;

    router.createUrlTree.mockReturnValue(urlTree);

    TestBed.runInInjectionContext(() => customerGuard({} as never, {} as never));

    expect(router.createUrlTree).toHaveBeenCalledTimes(1);

    const call = router.createUrlTree.mock.calls[0];

    expect(call[0]).toEqual(['/login']);

    expect(call[1]).toEqual({
      queryParams: {
        message: 'You are merchant, not allowed to use it.',
      },
    });
  });

  // =========================================================
  // VERIFY CUSTOMER DOES NOT REDIRECT
  // =========================================================

  it('should not create a redirect for CUSTOMER', () => {
    authService.isLoggedIn.mockReturnValue(true);

    authService.getRole.mockReturnValue('CUSTOMER');

    TestBed.runInInjectionContext(() => customerGuard({} as never, {} as never));

    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  // =========================================================
  // VERIFY LOGIN CHECK HAPPENS FIRST
  // =========================================================

  it('should not check role when user is not logged in', () => {
    authService.isLoggedIn.mockReturnValue(false);

    const urlTree = {} as UrlTree;

    router.createUrlTree.mockReturnValue(urlTree);

    TestBed.runInInjectionContext(() => customerGuard({} as never, {} as never));

    expect(authService.isLoggedIn).toHaveBeenCalledTimes(1);

    expect(authService.getRole).not.toHaveBeenCalled();

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
