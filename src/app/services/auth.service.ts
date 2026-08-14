import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';

@Injectable({
  providedIn: 'root',
})

//Author: Junior
export class AuthService {
  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api/auth';

  login(request: LoginRequest): Observable<LoginResponse> {
    console.log('AUTH SERVICE LOGIN CALLED');
    console.log('Login URL:', `${this.apiUrl}/login`);
    console.log('Login username:', request.username);

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        console.log('LOGIN RESPONSE:', response);

        localStorage.setItem('token', response.token);
        localStorage.setItem('username', response.username);
        localStorage.setItem('email', response.email);
        localStorage.setItem('role', response.role);
      }),
    );
  }

  register(data: { username: string; email: string; password: string }) {
    console.log('AUTH SERVICE REGISTER CALLED');

    return this.http.post<any>(`${this.apiUrl}/register`, data);
  }

  logout(): void {
    console.log('AUTH SERVICE LOGOUT CALLED');

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('username');
    localStorage.removeItem('role');

    console.log('Local authentication data cleared');
  }

  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUsername(): string {
    return localStorage.getItem('username') || '';
  }

  getEmail(): string {
    const user = localStorage.getItem('user');

    if (!user) {
      return '';
    }

    try {
      const userData = JSON.parse(user);
      return userData.email || '';
    } catch {
      return '';
    }
}

    getRole(): string {
    return localStorage.getItem('role') || '';
  }
}
