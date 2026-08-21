import { TestBed } from '@angular/core/testing';
import { HttpEvent, HttpHandlerFn, HttpHeaders, HttpRequest } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';

// AUTHOR: Htet Nandar(Grace)
// Covers the merged interceptor - see auth.interceptor.ts's history: this used to be two
// separately-registered interceptors (one universal, one admin-only), and forgetting to
// register the second one is exactly the bug that motivated merging them into one function.
describe('authInterceptor', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // authInterceptor calls next(...) synchronously as part of its return expression (it never
  // wraps the call in an Observable factory of its own), so the forwarded request is already
  // captured by the time this returns - no need to subscribe to the result.
  const runInterceptor = (url: string): HttpRequest<unknown> => {
    const req = new HttpRequest('GET', url);
    let forwarded: HttpRequest<unknown> | undefined;
    const next: HttpHandlerFn = (r) => {
      forwarded = r;
      return of({} as HttpEvent<unknown>);
    };

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    return forwarded!;
  };

  describe('a request that already carries an Authorization header', () => {
    it('leaves it untouched instead of overwriting it based on the URL heuristic', () => {
      localStorage.setItem('token', 'customer.jwt.token');
      const req = new HttpRequest('GET', '/api/auth/change-password', null, {
        headers: new HttpHeaders({ Authorization: 'Bearer admin.jwt.token' }),
      });
      let forwarded: HttpRequest<unknown> | undefined;
      const next: HttpHandlerFn = (r) => {
        forwarded = r;
        return of({} as HttpEvent<unknown>);
      };

      TestBed.runInInjectionContext(() => authInterceptor(req, next));

      expect(forwarded!.headers.get('Authorization')).toBe('Bearer admin.jwt.token');
    });
  });

  describe('non-admin URLs', () => {
    it('attaches the customer/merchant token from localStorage', () => {
      localStorage.setItem('token', 'customer.jwt.token');

      const forwarded = runInterceptor('/api/cart');

      expect(forwarded.headers.get('Authorization')).toBe('Bearer customer.jwt.token');
    });

    it('forwards the request unchanged when there is no customer/merchant token', () => {
      const forwarded = runInterceptor('/api/cart');

      expect(forwarded.headers.has('Authorization')).toBe(false);
    });

    it('ignores an admin token stored in sessionStorage', () => {
      sessionStorage.setItem('smartcart_admin_token', 'admin.jwt.token');
      sessionStorage.setItem('smartcart_admin_role', 'ADMIN');

      const forwarded = runInterceptor('/api/products/search');

      expect(forwarded.headers.has('Authorization')).toBe(false);
    });
  });

  describe('/admin/ URLs', () => {
    it('attaches the admin token instead of any customer/merchant token', () => {
      localStorage.setItem('token', 'customer.jwt.token');
      sessionStorage.setItem('smartcart_admin_token', 'admin.jwt.token');
      sessionStorage.setItem('smartcart_admin_role', 'ADMIN');

      const forwarded = runInterceptor('/api/admin/dashboard/stats');

      expect(forwarded.headers.get('Authorization')).toBe('Bearer admin.jwt.token');
    });

    it('forwards the request unchanged when there is no admin token, even if a customer token exists', () => {
      localStorage.setItem('token', 'customer.jwt.token');

      const forwarded = runInterceptor('/api/admin/products');

      expect(forwarded.headers.has('Authorization')).toBe(false);
    });
  });
});
