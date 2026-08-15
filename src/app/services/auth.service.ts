import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';
import { AuthStore } from '../security/auth-store';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})

//Author: Junior
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Unprefixed - localStorage['token'], localStorage['username'], etc, same keys this service
  // has always used. See AdminAuthService for the sessionStorage + 'smartcart_admin' prefixed
  // counterpart - AuthStore is what the two now share instead of duplicating this logic.
  private readonly store = new AuthStore(localStorage, '');

  login(request: LoginRequest): Observable<LoginResponse> {
    console.log('AUTH SERVICE LOGIN CALLED');
    console.log('Login URL:', `${this.apiUrl}/login`);
    console.log('Login email:', request.email);

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        console.log('LOGIN RESPONSE:', response);

        this.store.set('token', response.token);
        this.store.set('username', response.username);
        this.store.set('email', response.email);
        this.store.set('role', response.role);
      }),
    );
  }

  register(data: { username: string; email: string; password: string }) {
    console.log('AUTH SERVICE REGISTER CALLED');

    return this.http.post<any>(`${this.apiUrl}/register`, data);
  }

  logout(): void {
    console.log('AUTH SERVICE LOGOUT CALLED');

    this.store.clear(['token', 'user', 'username', 'email', 'role']);

    console.log('Local authentication data cleared');
  }

  clearSession(): void {
    this.store.clear(['token', 'username', 'email', 'role']);
  }

  isLoggedIn(): boolean {
    return !!this.store.get('token');
  }

  getUsername(): string {
    return this.store.get('username') || '';
  }

  getEmail(): string {
    return this.store.get('email') || '';
  }

  getRole(): string {
    return this.store.get('role') || '';
  }
}
