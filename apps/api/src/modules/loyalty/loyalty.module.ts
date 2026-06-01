import { Module } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { SecurityModule } from '../../common/auth/security.module';

@Module({
  imports: [AuditLogsModule, SecurityModule],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
