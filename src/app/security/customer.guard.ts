import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

// Author: Junior

export const customerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // =========================================================
  // CHECK LOGIN
  // =========================================================

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  // =========================================================
  // GET ROLE
  // =========================================================

  const role = authService.getRole();

  // =========================================================
  // MERCHANT IS NOT ALLOWED
  // =========================================================

  if (role === 'MERCHANT') {
    return router.createUrlTree(['/login'], {
      queryParams: {
        message: 'You are merchant, not allowed to use it.',
      },
    });
  }

  // =========================================================
  // CUSTOMER IS ALLOWED
  // =========================================================

  if (role === 'CUSTOMER') {
    return true;
  }

  // =========================================================
  // UNKNOWN ROLE
  // =========================================================

  return router.createUrlTree(['/login'], {
    queryParams: {
      message: 'You are not allowed to use this page.',
    },
  });
};
