import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuid } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateAccount(customerId: string) {
    let account = await this.prisma.loyaltyAccount.findUnique({ where: { customerId } });
    if (!account) {
      account = await this.prisma.loyaltyAccount.create({
        data: { customerId },
      });
    }
    return account;
  }

  async getMyAccount(userId: string) {
    const profile = await this.prisma.customerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Customer profile not found');
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
    const profile = await this.prisma.customerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Customer profile not found');
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
    const profile = await this.prisma.customerProfile.findUnique({ where: { userId } });
    if (!profile) return null;
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
    const profile = await this.prisma.customerProfile.findUnique({ where: { userId } });
    if (!profile) return null;
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
    const profile = await this.prisma.customerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Customer profile not found');
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
    const profile = await this.prisma.customerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Customer profile not found');
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
    const profile = await this.prisma.customerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Customer profile not found');
    let qrCard = await this.prisma.qRCard.findUnique({ where: { customerId: profile.id } });
    if (!qrCard) {
      qrCard = await this.prisma.qRCard.create({
        data: {
          customerId: profile.id,
          publicToken: uuid().replace(/-/g, '').substring(0, 16),
        },
      });
    }
    return qrCard;
  }

  async regenerateQR(userId: string) {
    const profile = await this.prisma.customerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Customer profile not found');
    const token = uuid().replace(/-/g, '').substring(0, 16);
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
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loyaltyAccount.count(),
    ]);
    return { items, total, page, limit };
  }

  async adminAdjustPoints(accountId: string, points: number, reason: string, adminUserId: string) {
    const account = await this.prisma.loyaltyAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Loyalty account not found');
    await this.prisma.loyaltyAccount.update({
      where: { id: accountId },
      data: {
        balance: { increment: points },
        ...(points > 0 ? { lifetimeEarned: { increment: points } } : { lifetimeRedeemed: { increment: Math.abs(points) } }),
      },
    });
    return this.prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: accountId,
        type: points > 0 ? 'ADMIN_ADJUST' : 'ADMIN_ADJUST',
        points,
        reason,
        createdBy: adminUserId,
      },
    });
  }

  async adminAdjustStamps(accountId: string, stamps: number, reason: string, adminUserId: string) {
    const account = await this.prisma.loyaltyAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Loyalty account not found');
    await this.prisma.loyaltyAccount.update({
      where: { id: accountId },
      data: {
        stampCount: { increment: stamps },
        ...(stamps > 0 ? { stampTotalEarned: { increment: stamps } } : {}),
      },
    });
    return this.prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: accountId,
        type: stamps > 0 ? 'ADMIN_STAMP' : 'ADMIN_STAMP',
        points: stamps,
        reason,
        createdBy: adminUserId,
      },
    });
  }
}
