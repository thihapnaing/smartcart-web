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

    expect(authService.isLoggedIn).toHaveBeenCalled();

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);

    expect(result).toBe(urlTree);
  });

  // =========================================================
  // MERCHANT
  // =========================================================

  it('should redirect merchant to login', () => {
    authService.isLoggedIn.mockReturnValue(true);

    authService.getRole.mockReturnValue('MERCHANT');

    const urlTree = {} as UrlTree;

    router.createUrlTree.mockReturnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => customerGuard({} as never, {} as never));

    expect(authService.getRole).toHaveBeenCalled();

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

  it('should allow USER to access the page', () => {
    authService.isLoggedIn.mockReturnValue(true);

    authService.getRole.mockReturnValue('USER');

    const result = TestBed.runInInjectionContext(() => customerGuard({} as never, {} as never));

    expect(authService.isLoggedIn).toHaveBeenCalled();

    expect(authService.getRole).toHaveBeenCalled();

    expect(router.createUrlTree).not.toHaveBeenCalled();

    expect(result).toBe(true);
  });

  // =========================================================
  // ADMIN
  // =========================================================

  it('should allow ADMIN to access the page', () => {
    authService.isLoggedIn.mockReturnValue(true);

    authService.getRole.mockReturnValue('ADMIN');

    const result = TestBed.runInInjectionContext(() => customerGuard({} as never, {} as never));

    expect(authService.getRole).toHaveBeenCalled();

    expect(router.createUrlTree).not.toHaveBeenCalled();

    expect(result).toBe(true);
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

    const call = router.createUrlTree.mock.calls[0];

    expect(call[0]).toEqual(['/login']);

    expect(call[1]).toEqual({
      queryParams: {
        message: 'You are merchant, not allowed to use it.',
      },
    });
  });
});
