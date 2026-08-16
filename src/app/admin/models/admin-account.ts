// AUTHOR: Htet Nandar(Grace)

// One admin (role = ADMIN) account row - mirrors the backend's AdminAccountDto. temporaryPassword
// is only ever populated on the response to createAdmin(); list rows never carry it (see
// AdminAccountService.toDto() on the backend). mustChangePassword is the "pending setup" signal
// used to badge rows that haven't replaced their temporary password yet.
export interface AdminAccount {
  id: number;
  username: string;
  email: string;
  status: string;
  createdAt: string;
  mustChangePassword: boolean;
  temporaryPassword?: string;
}

export interface CreateAdminRequest {
  username: string;
  email: string;
}
