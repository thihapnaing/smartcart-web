import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdminAuthService } from '../admin/services/admin-auth';

//Author: Junior

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // AUTHOR: Htet Nandar (Grace)
  // Respect a caller-set Authorization header instead of overwriting it - needed for
  // AdminAuthService.changePassword(), which hits /api/auth/change-password (no '/admin/' in
  // the URL, so the heuristic below would otherwise reach for the wrong token entirely).
  if (req.headers.has('Authorization')) {
    return next(req);
  }

  const token = req.url.includes('/admin/')
    ? inject(AdminAuthService).getToken()
    : localStorage.getItem('token');

  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
