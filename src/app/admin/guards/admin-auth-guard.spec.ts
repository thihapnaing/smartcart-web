import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { adminAuthGuard } from './admin-auth-guard';
import { AdminAuthService } from '../services/admin-auth';

describe('adminAuthGuard', () => {
  let adminAuth: AdminAuthService;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    adminAuth = TestBed.inject(AdminAuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  const runGuard = () => TestBed.runInInjectionContext(() => adminAuthGuard({} as never, {} as never));

  it('allows activation when the admin is logged in', () => {
    // Drives the signal directly rather than going through login() (now a real HTTP call) -
    // the guard only cares about isLoggedIn's current value, not how it got there.
    adminAuth.isLoggedIn.set(true);

    const result = runGuard();

    expect(result).toBe(true);
  });

  it('redirects to /admin/login when the admin is not logged in', () => {
    const fakeUrlTree = {} as ReturnType<Router['parseUrl']>;
    vi.spyOn(router, 'parseUrl').mockReturnValue(fakeUrlTree);

    const result = runGuard();

    expect(router.parseUrl).toHaveBeenCalledWith('/admin/login');
    expect(result).toBe(fakeUrlTree);
  });
});
