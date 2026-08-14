// Matches Spring Boot's LoginRequest DTO exactly (POST /api/auth/login).
export interface LoginRequest {
  email: string;
  password: string;
}
