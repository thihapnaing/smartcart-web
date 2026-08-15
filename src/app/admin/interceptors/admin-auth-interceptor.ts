import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdminAuthService } from '../services/admin-auth';

// AUTHOR: Htet Nandar(Grace)
/**
 * Attaches the admin JWT to /api/admin/** requests. The backend's SecurityConfig requires
 * hasRole("ADMIN") for that path specifically, so AdminDashboardService/AdminProductService
 * calls would be rejected without this.
 */
export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/admin/')) {
    return next(req);
  }

  const token = inject(AdminAuthService).getToken();
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
