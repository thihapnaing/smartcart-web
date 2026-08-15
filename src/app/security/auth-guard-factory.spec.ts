import { inject, Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { createAuthGuard } from './auth-guard-factory';

// AUTHOR: Htet Nandar(Grace)
describe('createAuthGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    router = TestBed.inject(Router);
  });

  const runGuard = (isLoggedIn: () => boolean, redirectTo: string) => {
    const guard = createAuthGuard(isLoggedIn, redirectTo);
    return TestBed.runInInjectionContext(() => guard({} as never, {} as never));
  };

  it('allows activation when isLoggedIn() returns true', () => {
    const result = runGuard(() => true, '/login');

    expect(result).toBe(true);
  });

  it('redirects to the given path when isLoggedIn() returns false', () => {
    const fakeUrlTree = {} as ReturnType<Router['parseUrl']>;
    vi.spyOn(router, 'parseUrl').mockReturnValue(fakeUrlTree);

    const result = runGuard(() => false, '/admin/login');

    expect(router.parseUrl).toHaveBeenCalledWith('/admin/login');
    expect(result).toBe(fakeUrlTree);
  });

  it('calls the isLoggedIn callback exactly once per activation', () => {
    const isLoggedIn = vi.fn(() => true);

    runGuard(isLoggedIn, '/login');

    expect(isLoggedIn).toHaveBeenCalledTimes(1);
  });

  it('supports an isLoggedIn callback that itself calls inject() - the pattern adminAuthGuard relies on', () => {
    // isLoggedIn only runs from inside the guard function the factory returns, which the
    // router (or TestBed.runInInjectionContext here) invokes within an injection context - so
    // a callback like `() => inject(AdminAuthService).isLoggedIn()` has to actually work, not
    // just type-check. A trivial injectable stands in for AdminAuthService here.
    @Injectable({ providedIn: 'root' })
    class LoginStatusProbe {
      loggedIn = true;
    }

    // The outer beforeEach already called TestBed.inject(Router), which instantiates the
    // module - configureTestingModule() refuses to run again after that point unless the
    // module is reset first (same pattern admin-auth.spec.ts uses for its fresh-instance test).
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), LoginStatusProbe],
    });

    const guard = createAuthGuard(() => inject(LoginStatusProbe).loggedIn, '/login');
    const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));

    expect(result).toBe(true);
  });
});
