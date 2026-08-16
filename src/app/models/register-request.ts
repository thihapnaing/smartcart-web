//Author: Junior

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  address?: string;
  postalCode?: string;
  phoneNumber?: string;
}
