import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const ADMIN_ROLES = ['admin', 'maestro'] as const;
export const STAFF_ADMIN_ROLES = ['admin', 'maestro', 'staff'] as const;

export type AppRole = 'admin' | 'maestro' | 'staff' | 'customer';

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
