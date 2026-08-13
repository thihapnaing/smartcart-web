import { Injectable, signal } from '@angular/core';

// AUTHOR: Htet Nandar(Grace)
/**
 * UI-only session flag for the admin area - there's no real backend auth yet (see
 * CurrentUserProvider.getCurrentAdmin(), which just hardcodes admin id=4), so this doesn't
 * verify a password against anything. It just remembers "the admin login form was submitted"
 * for this browser tab, so /admin/dashboard and /admin/products can't be reached by typing the
 * URL without going through /admin/login first, and the nav bar's Sign out button has something
 * real to do. Swap for a real JWT/session check once backend auth exists.
 */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private static readonly SESSION_KEY = 'smartcart_admin_session';

  readonly isLoggedIn = signal(sessionStorage.getItem(AdminAuthService.SESSION_KEY) === 'true');

  login(): void {
    sessionStorage.setItem(AdminAuthService.SESSION_KEY, 'true');
    this.isLoggedIn.set(true);
  }

  logout(): void {
    sessionStorage.removeItem(AdminAuthService.SESSION_KEY);
    this.isLoggedIn.set(false);
  }
}
