import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuid } from 'uuid';
import { AuditActions, AuditLogContext } from '../audit-logs/audit-log.types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class LoyaltyService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  private async getOrCreateAccount(customerId: string) {
    return this.prisma.loyaltyAccount.upsert({
      where: { customerId },
      update: {},
      create: { customerId },
    });
  }

  async getOrCreateCustomerProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== 'customer') {
      throw new BadRequestException('Loyalty is available for customer accounts only');
    }

    const profile = await this.prisma.customerProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    await this.getOrCreateAccount(profile.id);
    await this.prisma.qRCard.upsert({
      where: { customerId: profile.id },
      update: {},
      create: {
        customerId: profile.id,
        publicToken: this.generateQrPublicToken(),
      },
    });

    return profile;
  }

  async getMyAccount(userId: string) {
    const profile = await this.getOrCreateCustomerProfile(userId);
    const account = await this.getOrCreateAccount(profile.id);
    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: { loyaltyAccountId: account.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const stampTarget = await this.prisma.setting.findUnique({ where: { key: 'stamp_target' } });
    return {
      ...account,
      stampTarget: stampTarget ? parseInt(stampTarget.value) : 10,
      transactions,
    };
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const profile = await this.getOrCreateCustomerProfile(userId);
    const account = await this.getOrCreateAccount(profile.id);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where: { loyaltyAccountId: account.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loyaltyTransaction.count({ where: { loyaltyAccountId: account.id } }),
    ]);
    return { items, total, page, limit };
  }

  async awardPoints(userId: string, points: number, reason: string, orderId?: string) {
    const profile = await this.getOrCreateCustomerProfile(userId);
    const account = await this.getOrCreateAccount(profile.id);
    await this.prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        balance: { increment: points },
        lifetimeEarned: { increment: points },
      },
    });
    return this.prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        type: 'EARN',
        points,
        reason,
        orderId,
      },
    });
  }

  async awardStamp(userId: string, orderId: string) {
    const profile = await this.getOrCreateCustomerProfile(userId);
    const account = await this.getOrCreateAccount(profile.id);
    await this.prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        stampCount: { increment: 1 },
        stampTotalEarned: { increment: 1 },
      },
    });
    return this.prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        type: 'STAMP',
        points: 1,
        reason: 'New stamp earned',
        orderId,
      },
    });
  }

  async redeemStampReward(userId: string) {
    const profile = await this.getOrCreateCustomerProfile(userId);
    const account = await this.getOrCreateAccount(profile.id);
    const stampTarget = await this.prisma.setting.findUnique({ where: { key: 'stamp_target' } });
    const target = stampTarget ? parseInt(stampTarget.value) : 10;
    if (account.stampCount < target) {
      throw new BadRequestException(`Need ${target} stamps to redeem. You have ${account.stampCount}.`);
    }
    await this.prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { stampCount: { decrement: target } },
    });
    return this.prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        type: 'STAMP_REDEEM',
        points: -target,
        reason: `Redeemed ${target} stamps for free drink`,
      },
    });
  }

  async redeemPoints(userId: string, points: number) {
    const profile = await this.getOrCreateCustomerProfile(userId);
    const account = await this.getOrCreateAccount(profile.id);
    if (account.balance < points) {
      throw new BadRequestException(`Not enough points. You have ${account.balance}.`);
    }
    await this.prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        balance: { decrement: points },
        lifetimeRedeemed: { increment: points },
      },
    });
    return this.prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        type: 'REDEEM',
        points: -points,
        reason: `Redeemed ${points} points`,
      },
    });
  }

  async getQR(userId: string) {
    const profile = await this.getOrCreateCustomerProfile(userId);
    let qrCard = await this.prisma.qRCard.findUnique({ where: { customerId: profile.id } });
    if (!qrCard) {
      qrCard = await this.prisma.qRCard.create({
        data: {
          customerId: profile.id,
          publicToken: this.generateQrPublicToken(),
        },
      });
    }
    return qrCard;
  }

  async regenerateQR(userId: string) {
    const profile = await this.getOrCreateCustomerProfile(userId);
    const token = this.generateQrPublicToken();
    return this.prisma.qRCard.upsert({
      where: { customerId: profile.id },
      update: { publicToken: token, regeneratedAt: new Date() },
      create: { customerId: profile.id, publicToken: token },
    });
  }

  async findAccountByQRToken(token: string) {
    const qrCard = await this.prisma.qRCard.findUnique({ where: { publicToken: token } });
    if (!qrCard || !qrCard.isActive) return null;
    return this.prisma.loyaltyAccount.findUnique({
      where: { customerId: qrCard.customerId },
      include: { customer: true },
    });
  }

  async adminGetAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.loyaltyAccount.findMany({
        include: {
          customer: {
            include: { user: { select: { id: true, email: true, fullName: true } } },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loyaltyAccount.count(),
    ]);
    return { items, total, page, limit };
  }

  async adminAdjustPoints(accountId: string, points: number, reason: string, adminUserId: string, auditContext?: AuditLogContext) {
    const account = await this.prisma.loyaltyAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Loyalty account not found');
    const updatedAccount = await this.prisma.loyaltyAccount.update({
      where: { id: accountId },
      data: {
        balance: { increment: points },
        ...(points > 0 ? { lifetimeEarned: { increment: points } } : { lifetimeRedeemed: { increment: Math.abs(points) } }),
      },
    });

    const transaction = await this.prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: accountId,
        type: points > 0 ? 'ADMIN_ADJUST' : 'ADMIN_ADJUST',
        points,
        reason,
        createdBy: adminUserId,
      },
    });

    await this.auditLogs.record({
      ...auditContext,
      actorUserId: adminUserId,
      action: AuditActions.LOYALTY_POINTS_ADJUSTED,
      entityType: 'LoyaltyAccount',
      entityId: accountId,
      beforeSnapshot: account,
      afterSnapshot: {
        account: updatedAccount,
        transaction,
      },
    });

    return transaction;
  }

  async adminAdjustStamps(accountId: string, stamps: number, reason: string, adminUserId: string, auditContext?: AuditLogContext) {
    const account = await this.prisma.loyaltyAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Loyalty account not found');
    const updatedAccount = await this.prisma.loyaltyAccount.update({
      where: { id: accountId },
      data: {
        stampCount: { increment: stamps },
        ...(stamps > 0 ? { stampTotalEarned: { increment: stamps } } : {}),
      },
    });

    const transaction = await this.prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: accountId,
        type: stamps > 0 ? 'ADMIN_STAMP' : 'ADMIN_STAMP',
        points: stamps,
        reason,
        createdBy: adminUserId,
      },
    });

    await this.auditLogs.record({
      ...auditContext,
      actorUserId: adminUserId,
      action: AuditActions.LOYALTY_POINTS_ADJUSTED,
      entityType: 'LoyaltyAccount',
      entityId: accountId,
      beforeSnapshot: account,
      afterSnapshot: {
        account: updatedAccount,
        transaction,
      },
    });

    return transaction;
  }

  private generateQrPublicToken() {
    return uuid().replace(/-/g, '').substring(0, 20);
  }
}
