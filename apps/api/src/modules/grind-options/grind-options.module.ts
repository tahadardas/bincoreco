import { Module } from '@nestjs/common';
import { GrindOptionsService } from './grind-options.service';
import { GrindOptionsController } from './grind-options.controller';
import { SecurityModule } from '../../common/auth/security.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [SecurityModule, AuditLogsModule],
  controllers: [GrindOptionsController],
  providers: [GrindOptionsService],
  exports: [GrindOptionsService],
})
export class GrindOptionsModule {}
