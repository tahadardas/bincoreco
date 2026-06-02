import { InternalServerErrorException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { ReportsService } from '../reports/reports.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: any;
  let reportsService: any;

  beforeEach(() => {
    prisma = {
      order: {
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      product: { count: jest.fn() },
      user: { count: jest.fn() },
    };

    reportsService = {
      getTopProducts: jest.fn(),
    };

    const ordersService = {} as OrdersService;
    service = new AdminService(prisma as PrismaService, ordersService, reportsService as ReportsService);
  });

  it('returns dashboard data when all queries succeed', async () => {
    prisma.order.count.mockResolvedValueOnce(10);
    prisma.order.aggregate.mockResolvedValueOnce({ _sum: { total: { toNumber: () => 500000 } } });
    prisma.order.count.mockResolvedValueOnce(3);
    prisma.order.count.mockResolvedValueOnce(2);
    prisma.product.count.mockResolvedValueOnce(20);
    prisma.user.count.mockResolvedValueOnce(100);
    reportsService.getTopProducts.mockResolvedValueOnce([{ productId: 'p1', productName: 'Espresso', totalQuantity: 5, totalRevenue: 100000 }]);

    const result = await service.getDashboard();

    expect(result.todayOrders).toBe(10);
    expect(result.todayRevenue).toBe(500000);
    expect(result.pendingOrders).toBe(3);
    expect(result.preparingOrders).toBe(2);
    expect(result.totalActiveProducts).toBe(20);
    expect(result.totalCustomers).toBe(100);
    expect(result.topProducts).toHaveLength(1);
    expect(result.generatedAt).toBeDefined();
    expect(result.warnings).toBeUndefined();
  });

  it('includes warnings when some queries fail', async () => {
    prisma.order.count.mockResolvedValueOnce(10);
    prisma.order.aggregate.mockRejectedValueOnce(new Error('DB error'));
    prisma.order.count.mockResolvedValueOnce(3);
    prisma.order.count.mockResolvedValueOnce(2);
    prisma.product.count.mockResolvedValueOnce(20);
    prisma.user.count.mockResolvedValueOnce(100);
    reportsService.getTopProducts.mockResolvedValueOnce([]);

    const result = await service.getDashboard();

    expect(result.todayOrders).toBe(10);
    expect(result.todayRevenue).toBe(0);
    expect(result.warnings).toBeDefined();
    expect(result.warnings!.length).toBeGreaterThan(0);
  });

  it('throws when all queries fail', async () => {
    prisma.order.count.mockRejectedValueOnce(new Error('DB error'));
    prisma.order.aggregate.mockRejectedValueOnce(new Error('DB error'));
    prisma.order.count.mockRejectedValueOnce(new Error('DB error'));
    prisma.order.count.mockRejectedValueOnce(new Error('DB error'));
    prisma.product.count.mockRejectedValueOnce(new Error('DB error'));
    prisma.user.count.mockRejectedValueOnce(new Error('DB error'));
    reportsService.getTopProducts.mockRejectedValueOnce(new Error('DB error'));

    await expect(service.getDashboard()).rejects.toThrow(InternalServerErrorException);
  });
});
