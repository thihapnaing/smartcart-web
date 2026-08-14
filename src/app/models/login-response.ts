// Matches Spring Boot's LoginResponse DTO exactly - returned by POST /api/auth/login
// and /api/auth/register. `role` is one of the backend's UserRole enum values
// (CUSTOMER, MERCHANT, ADMIN, DELIVERYMAN), sent as a plain string.
export interface LoginResponse {
  token: string;
  userId: number;
  username: string;
  email: string;
  role: string;
}
