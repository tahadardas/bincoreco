import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AppRole, ROLES_KEY } from './roles.decorator';

type RequestWithUser = Request & {
  user?: {
    id: string;
    role?: string | null;
    mustChangePassword?: boolean;
  };
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!allowedRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const role = request.user?.role;

    if (request.user?.mustChangePassword) {
      throw new ForbiddenException('يجب تغيير كلمة المرور قبل متابعة العملية');
    }

    if (!role || !allowedRoles.includes(role as AppRole)) {
      throw new ForbiddenException('هذا الحساب لا يملك صلاحية تنفيذ هذه العملية');
    }

    return true;
  }
}
