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

<<<<<<< HEAD
    expect(authService.isLoggedIn).toHaveBeenCalled();
=======
    expect(authService.isLoggedIn).toHaveBeenCalledTimes(1);
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);

    expect(result).toBe(urlTree);
  });

  // =========================================================
<<<<<<< HEAD
  // MERCHANT
  // =========================================================

  it('should redirect merchant to login', () => {
=======
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
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7
    authService.isLoggedIn.mockReturnValue(true);

    authService.getRole.mockReturnValue('MERCHANT');

    const urlTree = {} as UrlTree;

    router.createUrlTree.mockReturnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => customerGuard({} as never, {} as never));

<<<<<<< HEAD
    expect(authService.getRole).toHaveBeenCalled();
=======
    expect(authService.getRole).toHaveBeenCalledTimes(1);
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7

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

<<<<<<< HEAD
  it('should allow USER to access the page', () => {
=======
  it('should redirect USER to login', () => {
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7
    authService.isLoggedIn.mockReturnValue(true);

    authService.getRole.mockReturnValue('USER');

<<<<<<< HEAD
    const result = TestBed.runInInjectionContext(() => customerGuard({} as never, {} as never));

    expect(authService.isLoggedIn).toHaveBeenCalled();

    expect(authService.getRole).toHaveBeenCalled();

    expect(router.createUrlTree).not.toHaveBeenCalled();

    expect(result).toBe(true);
=======
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
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7
  });

  // =========================================================
  // ADMIN
  // =========================================================

<<<<<<< HEAD
  it('should allow ADMIN to access the page', () => {
=======
  it('should redirect ADMIN to login', () => {
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7
    authService.isLoggedIn.mockReturnValue(true);

    authService.getRole.mockReturnValue('ADMIN');

<<<<<<< HEAD
    const result = TestBed.runInInjectionContext(() => customerGuard({} as never, {} as never));

    expect(authService.getRole).toHaveBeenCalled();

    expect(router.createUrlTree).not.toHaveBeenCalled();

    expect(result).toBe(true);
=======
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
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7
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

<<<<<<< HEAD
=======
    expect(router.createUrlTree).toHaveBeenCalledTimes(1);

>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7
    const call = router.createUrlTree.mock.calls[0];

    expect(call[0]).toEqual(['/login']);

    expect(call[1]).toEqual({
      queryParams: {
        message: 'You are merchant, not allowed to use it.',
      },
    });
  });
<<<<<<< HEAD
=======

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
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7
});
