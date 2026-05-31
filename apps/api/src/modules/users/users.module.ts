import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SecurityModule } from '../../common/auth/security.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [SecurityModule, AuditLogsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
