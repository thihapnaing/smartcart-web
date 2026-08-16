import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdminAuthService } from '../admin/services/admin-auth';

//Author: Junior

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = req.url.includes('/admin/')
    ? inject(AdminAuthService).getToken()
    : localStorage.getItem('token');

  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
