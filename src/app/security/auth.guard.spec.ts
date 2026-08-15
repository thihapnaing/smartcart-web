import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { authGuard } from './auth.guard';

// AUTHOR: Htet Nandar(Grace)
describe('authGuard', () => {
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  const runGuard = () => TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

  it('allows activation when a token is present in localStorage', () => {
    localStorage.setItem('token', 'fake.jwt.token');

    expect(runGuard()).toBe(true);
  });

  it('redirects to /login when there is no token in localStorage', () => {
    const fakeUrlTree = {} as ReturnType<Router['parseUrl']>;
    vi.spyOn(router, 'parseUrl').mockReturnValue(fakeUrlTree);

    const result = runGuard();

    expect(router.parseUrl).toHaveBeenCalledWith('/login');
    expect(result).toBe(fakeUrlTree);
  });

  it('does not read an admin sessionStorage token - only the customer/merchant localStorage one', () => {
    // Regression guard: authGuard and adminAuthGuard must stay independent even though this
    // browser session could plausibly have both an admin and a customer session at once.
    sessionStorage.setItem('smartcart_admin_token', 'admin.jwt.token');
    const fakeUrlTree = {} as ReturnType<Router['parseUrl']>;
    vi.spyOn(router, 'parseUrl').mockReturnValue(fakeUrlTree);

    const result = runGuard();

    expect(result).toBe(fakeUrlTree);
    sessionStorage.clear();
  });
});
