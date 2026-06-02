import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      customerProfile: {
        upsert: jest.fn(),
      },
      loyaltyAccount: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      qRCard: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
      },
      setting: {
        findUnique: jest.fn(),
      },
      loyaltyTransaction: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
      },
    };

    const auditLogs = { record: jest.fn() };

    service = new LoyaltyService(prisma as unknown as PrismaService, auditLogs as unknown as AuditLogsService);
  });

  describe('getOrCreateCustomerProfile', () => {
    it('throws NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getOrCreateCustomerProfile('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when user role is not customer', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'admin' });

      await expect(service.getOrCreateCustomerProfile('user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('calculateLoyaltyPoints', () => {
    it('returns 0 for non-positive total', async () => {
      const points = await service.calculateLoyaltyPoints(0, 'SYP');
      expect(points).toBe(0);
    });

    it('calculates points based on setting', async () => {
      prisma.setting.findUnique.mockImplementation(async ({ where }: { where: { key: string } }) => {
        if (where.key === 'loyalty_points_per_amount_SYP') return { key: 'loyalty_points_per_amount_SYP', value: '1000' };
        return null;
      });

      const points = await service.calculateLoyaltyPoints(5000, 'SYP');
      expect(points).toBe(5);
    });
  });

  describe('redeemStampReward', () => {
    it('rejects if stamp count is below target', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'customer' });
      prisma.customerProfile.upsert.mockResolvedValue({ id: 'profile-1', userId: 'user-1' });
      prisma.loyaltyAccount.upsert.mockResolvedValue({ id: 'account-1', stampCount: 3 });
      prisma.setting.findUnique.mockResolvedValue({ key: 'stamp_target', value: '10' });

      await expect(service.redeemStampReward('user-1')).rejects.toThrow(BadRequestException);
    });
  });
});
