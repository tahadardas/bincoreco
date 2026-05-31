import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogEntry } from './audit-log.types';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditLogEntry) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: entry.actorUserId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        beforeSnapshot: this.toNullableJson(entry.beforeSnapshot),
        afterSnapshot: this.toNullableJson(entry.afterSnapshot),
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  }

  private toNullableJson(value: unknown) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return Prisma.JsonNull;
    }

    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
