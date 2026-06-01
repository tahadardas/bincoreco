import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppRole } from '../../common/auth/roles.decorator';
import { AuditActions, AuditLogContext } from '../audit-logs/audit-log.types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, phone: true, fullName: true, role: true, isActive: true, createdAt: true, updatedAt: true,
        customerProfile: { include: { loyaltyAccount: true, qrCard: true } },
      },
    });
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

  async findByIdWithDetails(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        customerProfile: {
          include: {
            loyaltyAccount: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } } },
            qrCard: true,
          },
        },
        orders: { orderBy: { createdAt: 'desc' }, take: 10 },
        reviews: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const orderStats = await this.prisma.order.aggregate({
      where: { customerId: id },
      _count: { id: true },
      _sum: { total: true },
    });

    return {
      ...user,
      passwordHash: undefined,
      orderCount: orderStats._count.id,
      totalSpent: orderStats._sum.total,
    };
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

  async updateStatus(id: string, isActive: boolean, reason?: string, auditContext?: AuditLogContext) {
    const before = await this.prisma.user.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('User not found');

    if (!isActive && before.role === 'admin') {
      const adminCount = await this.prisma.user.count({ where: { role: 'admin', isActive: true } });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot deactivate the last active admin');
      }
    }

    const after = await this.prisma.user.update({
      where: { id },
      data: { isActive },
    });

    await this.auditLogs.record({
      ...auditContext,
      action: AuditActions.USER_STATUS_CHANGED,
      entityType: 'User',
      entityId: id,
      beforeSnapshot: { id: before.id, isActive: before.isActive },
      afterSnapshot: { id: after.id, isActive: after.isActive, reason },
    });

    return after;
  }

  async resetPassword(id: string, newPassword?: string, forceChangeOnNextLogin?: boolean, auditContext?: AuditLogContext) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    let password = newPassword;
    let generated = false;
    if (!password) {
      password = crypto.randomBytes(4).toString('hex') + '@A1';
      generated = true;
    }

    if (password.length < 8) {
      throw new BadRequestException('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: forceChangeOnNextLogin ?? false,
        passwordUpdatedAt: new Date(),
      },
    });

    await this.auditLogs.record({
      ...auditContext,
      action: AuditActions.USER_PASSWORD_RESET,
      entityType: 'User',
      entityId: id,
      afterSnapshot: { resetAt: new Date().toISOString(), forceChange: forceChangeOnNextLogin },
    });

    if (generated) {
      return { message: 'Password reset successfully', temporaryPassword: password, generated: true };
    }
    return { message: 'Password reset successfully', generated: false };
  }

  async findAll(params: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean; fromDate?: string; toDate?: string }) {
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
    if (params.role) where.role = params.role;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.fromDate || params.toDate) {
      where.createdAt = {};
      if (params.fromDate) where.createdAt.gte = new Date(params.fromDate);
      if (params.toDate) where.createdAt.lte = new Date(params.toDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
        id: true, email: true, phone: true, fullName: true, role: true, isActive: true, mustChangePassword: true, createdAt: true, updatedAt: true,
          _count: { select: { orders: true } },
          customerProfile: { select: { loyaltyAccount: { select: { balance: true } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}
