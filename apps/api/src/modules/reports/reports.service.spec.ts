import { OrderStatus, Prisma } from '@prisma/client';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportsService', () => {
  const createService = () => {
    const prisma = {
      orderItem: { groupBy: jest.fn().mockResolvedValue([]) },
      product: { findMany: jest.fn().mockResolvedValue([]) },
      order: {
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    return {
      prisma,
      service: new ReportsService(prisma as unknown as PrismaService),
    };
  };

  it('keeps fromDate and toDate filters together and excludes cancelled orders from top products', async () => {
    const { prisma, service } = createService();
    await service.getTopProducts({
      fromDate: '2026-05-01T00:00:00.000Z',
      toDate: '2026-05-30T23:59:59.999Z',
      limit: 5,
    });

    expect(prisma.orderItem.groupBy).toHaveBeenCalledWith(expect.objectContaining({
      by: ['productId', 'productNameSnapshot', 'currencyCode'],
      where: {
        order: {
          createdAt: {
            gte: new Date('2026-05-01T00:00:00.000Z'),
            lte: new Date('2026-05-30T23:59:59.999Z'),
          },
          status: { not: OrderStatus.CANCELLED },
        },
      },
    }));
  });

  it('supports top products with only fromDate', async () => {
    const { prisma, service } = createService();
    await service.getTopProducts({ fromDate: '2026-05-01T00:00:00.000Z' });

    expect(prisma.orderItem.groupBy).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        order: {
          createdAt: {
            gte: new Date('2026-05-01T00:00:00.000Z'),
          },
          status: { not: OrderStatus.CANCELLED },
        },
      },
    }));
  });

  it('supports top products with only toDate', async () => {
    const { prisma, service } = createService();
    await service.getTopProducts({ toDate: '2026-05-30T23:59:59.999Z' });

    expect(prisma.orderItem.groupBy).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        order: {
          createdAt: {
            lte: new Date('2026-05-30T23:59:59.999Z'),
          },
          status: { not: OrderStatus.CANCELLED },
        },
      },
    }));
  });

  it('excludes cancelled orders from revenue by date range', async () => {
    const { prisma, service } = createService();
    prisma.order.groupBy.mockResolvedValue([
      {
        currencyCode: 'SYP',
        _count: { _all: 2 },
        _sum: { total: new Prisma.Decimal(3000) },
      },
    ]);

    const result = await service.getRevenueByDateRange({
      fromDate: '2026-05-01T00:00:00.000Z',
    });

    expect(prisma.order.groupBy).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        createdAt: {
          gte: new Date('2026-05-01T00:00:00.000Z'),
        },
        status: { not: OrderStatus.CANCELLED },
      },
    }));
    expect(result).toEqual({
      totalRevenue: 3000,
      orderCount: 2,
      totalsByCurrency: [{ currencyCode: 'SYP', totalRevenue: 3000, orderCount: 2 }],
    });
  });

  it('calculates daily sales from stored order totals and status history', async () => {
    const { prisma, service } = createService();
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'order-1',
        status: OrderStatus.PICKED_UP,
        total: new Prisma.Decimal(2500),
        currencyCode: 'SYP',
        createdAt: new Date('2026-05-10T08:00:00.000Z'),
        statusHistory: [
          { toStatus: OrderStatus.PENDING, createdAt: new Date('2026-05-10T08:00:00.000Z') },
          { toStatus: OrderStatus.ACCEPTED, createdAt: new Date('2026-05-10T08:05:00.000Z') },
          { toStatus: OrderStatus.READY_FOR_PICKUP, createdAt: new Date('2026-05-10T08:20:00.000Z') },
          { toStatus: OrderStatus.PICKED_UP, createdAt: new Date('2026-05-10T08:25:00.000Z') },
        ],
      },
      {
        id: 'order-2',
        status: OrderStatus.CANCELLED,
        total: new Prisma.Decimal(9000),
        currencyCode: 'SYP',
        createdAt: new Date('2026-05-10T09:00:00.000Z'),
        statusHistory: [
          { toStatus: OrderStatus.PENDING, createdAt: new Date('2026-05-10T09:00:00.000Z') },
          { toStatus: OrderStatus.CANCELLED, createdAt: new Date('2026-05-10T09:03:00.000Z') },
        ],
      },
    ]);

    const result = await service.getDailySales({
      fromDate: '2026-05-10T00:00:00.000Z',
      toDate: '2026-05-10T23:59:59.999Z',
    });

    expect(result.totalOrders).toBe(2);
    expect(result.totalRevenue).toBe(2500);
    expect(result.cancelledOrders).toBe(1);
    expect(result.averagePreparationTime).toBe(15);
    expect(result.dailySales).toEqual([
      {
        date: '2026-05-10',
        totalOrders: 2,
        cancelledOrders: 1,
        totalRevenue: 2500,
        revenueByCurrency: { SYP: 2500 },
      },
    ]);
  });
});
