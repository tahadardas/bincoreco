import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';

type RequestWithUser = Request & {
  user?: {
    mustChangePassword?: boolean;
  };
};

@Injectable()
export class MustChangePasswordGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (request.user?.mustChangePassword) {
      throw new ForbiddenException('يجب تغيير كلمة المرور قبل متابعة العملية');
    }

    return true;
  }
}
