import { Module } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { MustChangePasswordGuard } from './must-change-password.guard';

@Module({
  providers: [RolesGuard, OptionalJwtAuthGuard, MustChangePasswordGuard],
  exports: [RolesGuard, OptionalJwtAuthGuard, MustChangePasswordGuard],
})
export class SecurityModule {}
