//Author: Junior

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token = localStorage.getItem('token');

  if (token) {
    return true;
  }

  console.log('No authentication token. Redirecting to login.');

  return router.createUrlTree(['/login']);
};
