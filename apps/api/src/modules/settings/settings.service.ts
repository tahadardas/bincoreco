import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditActions, AuditLogContext } from '../audit-logs/audit-log.types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  async get(key: string) {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    return setting?.value || null;
  }

  async set(key: string, value: string, auditContext?: AuditLogContext) {
    const before = await this.prisma.setting.findUnique({ where: { key } });
    const after = await this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    await this.auditLogs.record({
      ...auditContext,
      action: AuditActions.SETTING_CHANGED,
      entityType: 'Setting',
      entityId: key,
      beforeSnapshot: before,
      afterSnapshot: after,
    });

    return after;
  }

  async getAll() {
    const settings = await this.prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }
}
