//Author: Junior

import { createAuthGuard } from './auth-guard-factory';

export const authGuard = createAuthGuard(
  () => !!localStorage.getItem('token'),
  '/login');
