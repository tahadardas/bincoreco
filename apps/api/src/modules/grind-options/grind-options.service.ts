import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateGrindOptionInput } from '@banco-ricco/validators';
import { PrismaService } from '../prisma/prisma.service';
import { AuditActions, AuditLogContext } from '../audit-logs/audit-log.types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class GrindOptionsService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  async findAll() {
    return this.prisma.grindOption.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.grindOption.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const option = await this.prisma.grindOption.findUnique({ where: { id } });
    if (!option) throw new NotFoundException('Grind option not found');
    return option;
  }

  async create(data: {
    code: string;
    nameAr: string;
    nameEn: string;
    descriptionAr?: string;
    descriptionEn?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    return this.prisma.grindOption.create({ data });
  }

  async update(id: string, data: UpdateGrindOptionInput, auditContext?: AuditLogContext) {
    const before = await this.findById(id);
    const after = await this.prisma.grindOption.update({ where: { id }, data });

    await this.auditLogs.record({
      ...auditContext,
      action: AuditActions.GRIND_OPTION_UPDATED,
      entityType: 'GrindOption',
      entityId: id,
      beforeSnapshot: before,
      afterSnapshot: after,
    });

    return after;
  }

  async remove(id: string, auditContext?: AuditLogContext) {
    const before = await this.findById(id);
    const after = await this.prisma.grindOption.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditLogs.record({
      ...auditContext,
      action: AuditActions.GRIND_OPTION_UPDATED,
      entityType: 'GrindOption',
      entityId: id,
      beforeSnapshot: before,
      afterSnapshot: after,
    });

    return after;
  }
}
