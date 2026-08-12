import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth';

// AUTHOR: Htet Nandar(Grace)
// Sends anyone who hasn't been through /admin/login back there. See AdminAuthService for why
// this is a client-side-only flag rather than a real auth check.
export const adminAuthGuard: CanActivateFn = () => {
  const adminAuth = inject(AdminAuthService);
  const router = inject(Router);

  if (adminAuth.isLoggedIn()) {
    return true;
  }

  return router.parseUrl('/admin/login');
};
