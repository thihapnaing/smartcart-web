//Author: Junior

export interface LoginResponse {
  userId?: number;
  username: string;
  email: string;
  role: string;
  token: string;
  // AUTHOR: Htet Nandar (Grace)
  // True only for an admin account created via POST /api/admin/admins that hasn't replaced its
  // fixed temporary password yet - tells the caller to redirect to the change-password page.
  mustChangePassword?: boolean;
}
