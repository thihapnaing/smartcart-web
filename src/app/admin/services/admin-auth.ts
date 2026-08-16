import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChangePasswordRequest } from '../../models/change-password-request';
import { LoginRequest } from '../../models/login-request';
import { LoginResponse } from '../../models/login-response';
import { AuthStore } from '../../security/auth-store';

// AUTHOR: Htet Nandar(Grace)
/**
 * Real backend auth for the admin area - calls POST /api/auth/login (see AuthController /
 * AuthService on the backend) and keeps the JWT + role in sessionStorage for this tab.
 */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private static readonly ADMIN_ROLE = 'ADMIN';

  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/auth`;

  // sessionStorage + 'smartcart_admin' prefix -> smartcart_admin_token / smartcart_admin_role.
  // See AuthService for the localStorage, unprefixed counterpart this shares AuthStore with.
  private readonly store = new AuthStore(sessionStorage, 'smartcart_admin');

  readonly isLoggedIn = signal(
    !!this.store.get('token') && this.store.get('role') === AdminAuthService.ADMIN_ROLE,
  );

  login(email: string, password: string): Observable<LoginResponse> {
    const request: LoginRequest = { email, password };
    return this.http.post<LoginResponse>(`${this.apiBase}/login`, request).pipe(
      tap((response) => {
        this.store.set('token', response.token);
        this.store.set('role', response.role);
        this.isLoggedIn.set(response.role === AdminAuthService.ADMIN_ROLE);
      }),
    );
  }

  // AUTHOR: Htet Nandar (Grace)
  // POST /api/auth/change-password has no '/admin/' in its URL, so the shared authInterceptor's
  // URL-based heuristic would reach for the customer/merchant localStorage token instead of the
  // admin one it actually needs here - setting the Authorization header explicitly sidesteps
  // that (the interceptor leaves an already-set header alone).
  changePassword(newPassword: string, confirmPassword: string): Observable<{ message: string }> {
    const request: ChangePasswordRequest = { newPassword, confirmPassword };
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
    return this.http.post<{ message: string }>(`${this.apiBase}/change-password`, request, { headers });
  }

  logout(): void {
    this.store.clear(['token', 'role']);
    this.isLoggedIn.set(false);
  }

  getToken(): string | null {
    return this.store.get('token');
  }
}
