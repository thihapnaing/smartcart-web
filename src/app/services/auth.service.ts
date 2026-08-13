import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly API_URL = 'http://localhost:8080/api/auth';

  private readonly TOKEN_KEY = 'smartcart_token';
  private readonly USER_KEY = 'smartcart_user';

  constructor(private http: HttpClient) {}

  /**
   * Login existing user
   */
  login(request: LoginRequest): Observable<AuthResponse> {

    return this.http
      .post<AuthResponse>(
        `${this.API_URL}/login`,
        request
      )
      .pipe(
        tap(response => {
          this.saveAuthentication(response);
        })
      );
  }

  /**
   * Register new customer
   */
  register(request: RegisterRequest): Observable<AuthResponse> {

    return this.http
      .post<AuthResponse>(
        `${this.API_URL}/register`,
        request
      )
      .pipe(
        tap(response => {
          this.saveAuthentication(response);
        })
      );
  }

  /**
   * Save JWT and user information
   */
  private saveAuthentication(response: AuthResponse): void {

    localStorage.setItem(
      this.TOKEN_KEY,
      response.token
    );

    localStorage.setItem(
      this.USER_KEY,
      JSON.stringify({
        userId: response.userId,
        username: response.username,
        email: response.email,
        role: response.role
      })
    );
  }

  /**
   * Get JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get logged-in user
   */
  getCurrentUser(): AuthResponse | null {

    const user = localStorage.getItem(this.USER_KEY);

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as AuthResponse;
    } catch {
      return null;
    }
  }

  /**
   * Check whether user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Logout
   */
  logout(): void {

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Get current user ID
   */
  getUserId(): number | null {

    const user = this.getCurrentUser();

    return user ? user.userId : null;
  }

  /**
   * Get current username
   */
  getUsername(): string | null {

    const user = this.getCurrentUser();

    return user ? user.username : null;
  }

  /**
   * Get current email
   */
  getEmail(): string | null {

    const user = this.getCurrentUser();

    return user ? user.email : null;
  }

  /**
   * Get current role
   */
  getRole(): string | null {

    const user = this.getCurrentUser();

    return user ? user.role : null;
  }
}
