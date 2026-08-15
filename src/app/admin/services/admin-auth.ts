import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../../models/login-request';
import { LoginResponse } from '../../models/login-response';

// AUTHOR: Htet Nandar(Grace)
/**
 * Real backend auth for the admin area - calls POST /api/auth/login (see AuthController /
 * AuthService on the backend) and keeps the JWT + role in sessionStorage for this tab.
 *
 * isLoggedIn only ever becomes true for an ADMIN-role account. This is a UX check, not a
 * security boundary by itself - the real enforcement is on the backend, where SecurityConfig
 * requires hasRole("ADMIN") for /api/admin/**. Without this client-side check, a logged-in
 * CUSTOMER/MERCHANT would still get redirected past the login screen into the admin UI shell,
 * then have every API call fail with 403 - checking the role here just avoids that dead end.
 */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private static readonly TOKEN_KEY = 'smartcart_admin_token';
  private static readonly ROLE_KEY = 'smartcart_admin_role';
  private static readonly ADMIN_ROLE = 'ADMIN';

  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/auth`;

  readonly isLoggedIn = signal(
    !!sessionStorage.getItem(AdminAuthService.TOKEN_KEY) &&
      sessionStorage.getItem(AdminAuthService.ROLE_KEY) === AdminAuthService.ADMIN_ROLE,
  );

  login(email: string, password: string): Observable<LoginResponse> {
    const request: LoginRequest = { email, password };
    return this.http.post<LoginResponse>(`${this.apiBase}/login`, request).pipe(
      tap((response) => {
        sessionStorage.setItem(AdminAuthService.TOKEN_KEY, response.token);
        sessionStorage.setItem(AdminAuthService.ROLE_KEY, response.role);
        this.isLoggedIn.set(response.role === AdminAuthService.ADMIN_ROLE);
      }),
    );
  }

  logout(): void {
    sessionStorage.removeItem(AdminAuthService.TOKEN_KEY);
    sessionStorage.removeItem(AdminAuthService.ROLE_KEY);
    this.isLoggedIn.set(false);
  }

  getToken(): string | null {
    return sessionStorage.getItem(AdminAuthService.TOKEN_KEY);
  }
}
