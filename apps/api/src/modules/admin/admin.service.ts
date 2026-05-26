import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {}

  async getDashboard() {
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
    ] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'PREPARING' } }),
      this.prisma.product.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.user.count({ where: { role: 'customer', isActive: true } }),
    ]);

    return {
      todayOrders: todayOrdersCount,
      todayRevenue: todayRevenue._sum.total || 0,
      pendingOrders,
      preparingOrders,
      totalActiveProducts: totalProducts,
      totalCustomers,
    };
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

  async updateOrderStatus(id: string, status: string, reason?: string, changedBy?: string) {
    return this.ordersService.updateStatus(id, status, reason, changedBy);
  }
}
