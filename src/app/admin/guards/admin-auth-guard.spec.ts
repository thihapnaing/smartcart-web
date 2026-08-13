import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { adminAuthGuard } from './admin-auth-guard';
import { AdminAuthService } from '../services/admin-auth';

describe('adminAuthGuard', () => {
  let adminAuth: AdminAuthService;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    adminAuth = TestBed.inject(AdminAuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  const runGuard = () => TestBed.runInInjectionContext(() => adminAuthGuard({} as never, {} as never));

  it('allows activation when the admin is logged in', () => {
    adminAuth.login();

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
