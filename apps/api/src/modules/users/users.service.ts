import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppRole } from '../../common/auth/roles.decorator';
import { AuditActions, AuditLogContext } from '../audit-logs/audit-log.types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdentifier(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
      },
    });
  }

  async create(data: { email: string | null; phone: string | null; passwordHash: string; fullName: string }) {
    return this.prisma.user.create({ data });
  }

  async updateRole(id: string, role: AppRole, auditContext?: AuditLogContext) {
    const before = await this.prisma.user.findUnique({ where: { id } });
    if (!before) {
      throw new NotFoundException('User not found');
    }

    const after = await this.prisma.user.update({
      where: { id },
      data: { role },
    });

    await this.auditLogs.record({
      ...auditContext,
      action: AuditActions.USER_ROLE_CHANGED,
      entityType: 'User',
      entityId: id,
      beforeSnapshot: { id: before.id, role: before.role },
      afterSnapshot: { id: after.id, role: after.role },
    });

    return after;
  }

  async findAll(params: { page?: number; limit?: number; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}
