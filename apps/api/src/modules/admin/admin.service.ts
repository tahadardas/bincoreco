import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { AuditLogContext } from '../audit-logs/audit-log.types';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private reportsService: ReportsService,
  ) {}

  async getDashboard() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [
        todayOrdersCount,
        todayRevenue,
        pendingOrders,
        preparingOrders,
        totalProducts,
        totalCustomers,
        topProducts,
      ] = await Promise.all([
        this.prisma.order.count({
          where: { createdAt: { gte: today, lt: tomorrow } },
        }),
        this.prisma.order.aggregate({
          where: { createdAt: { gte: today, lt: tomorrow }, status: { not: 'CANCELLED' } },
          _sum: { total: true },
        }).catch(() => ({ _sum: { total: null } })),
        this.prisma.order.count({ where: { status: 'PENDING' } }),
        this.prisma.order.count({ where: { status: 'PREPARING' } }),
        this.prisma.product.count({ where: { isActive: true, deletedAt: null } }),
        this.prisma.user.count({ where: { role: 'customer', isActive: true } }),
        this.reportsService.getTopProducts({
          fromDate: today.toISOString(),
          toDate: tomorrow.toISOString(),
          limit: 5,
        }).catch(() => []),
      ]);
      const todayRevenueTotal = todayRevenue?._sum?.total?.toNumber() || 0;

      return {
        todayOrders: todayOrdersCount || 0,
        todayRevenue: todayRevenueTotal || 0,
        pendingOrders: pendingOrders || 0,
        preparingOrders: preparingOrders || 0,
        totalActiveProducts: totalProducts || 0,
        totalCustomers: totalCustomers || 0,
        topProducts: topProducts || [],
      };
    } catch (e: any) {
      return {
        todayOrders: 0, todayRevenue: 0, pendingOrders: 0,
        preparingOrders: 0, totalActiveProducts: 0, totalCustomers: 0,
        topProducts: [],
      };
    }
  }

  async getOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
  }) {
    return this.ordersService.findAll(params);
  }

  async updateOrderStatus(id: string, status: string, reason?: string, changedBy?: string, auditContext?: AuditLogContext) {
    return this.ordersService.updateStatus(id, status, reason, changedBy, auditContext);
  }
}
