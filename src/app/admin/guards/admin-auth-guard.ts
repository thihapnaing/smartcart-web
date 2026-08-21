import { inject } from '@angular/core';
import { createAuthGuard } from '../../security/auth-guard-factory';
import { AdminAuthService } from '../services/admin-auth';

// AUTHOR: Htet Nandar(Grace)
// Sends anyone who hasn't been through /admin/login back there. See AdminAuthService for why
// this is a client-side-only flag rather than a real auth check.
export const adminAuthGuard = createAuthGuard(
  () => inject(AdminAuthService).isLoggedIn(),
  '/admin/login',
);
