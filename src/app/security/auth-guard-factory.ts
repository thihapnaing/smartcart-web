import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

// AUTHOR: Htet Nandar(Grace)
/**
 * Shared shape behind authGuard (customer/merchant) and adminAuthGuard: check some
 * "is logged in" condition, and if it fails, redirect to a login page. What differs between
 * the two - the check itself (any token present vs token AND role === ADMIN) and where to
 * redirect - stays a parameter here instead of being duplicated in two near-identical guards.
 *
 * isLoggedIn is a callback, not a boolean, so it can call inject() (e.g. inject(AdminAuthService))
 * when it runs - that only works because it's invoked from inside the returned guard function,
 * which the router calls within an injection context. Evaluating it eagerly at module load time
 * (when createAuthGuard itself runs) would throw.
 */
export function createAuthGuard(isLoggedIn: () => boolean, redirectTo: string): CanActivateFn {
  return () => {
    const router = inject(Router);

    if (isLoggedIn()) {
      return true;
    }

    return router.parseUrl(redirectTo);
  };
}
