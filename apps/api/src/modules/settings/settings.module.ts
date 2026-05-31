import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SecurityModule } from '../../common/auth/security.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [SecurityModule, AuditLogsModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
