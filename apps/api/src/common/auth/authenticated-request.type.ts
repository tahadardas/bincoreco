import { Request } from 'express';
import { AppRole } from './roles.decorator';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  role: AppRole;
  mustChangePassword?: boolean;
}

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
