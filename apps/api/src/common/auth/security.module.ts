import { Module } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

@Module({
  providers: [RolesGuard, OptionalJwtAuthGuard],
  exports: [RolesGuard, OptionalJwtAuthGuard],
})
export class SecurityModule {}
