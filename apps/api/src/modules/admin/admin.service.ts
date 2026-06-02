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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const results = await Promise.allSettled([
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
      this.reportsService.getTopProducts({
        fromDate: today.toISOString(),
        toDate: tomorrow.toISOString(),
        limit: 5,
      }),
    ]);

    const warnings: string[] = [];

    const todayOrdersCount = results[0].status === 'fulfilled' ? results[0].value : (() => { warnings.push('تعذر حساب طلبات اليوم'); return 0; })();
    const todayRevenue = results[1].status === 'fulfilled' ? (results[1].value._sum?.total?.toNumber() || 0) : (() => { warnings.push('تعذر حساب مبيعات اليوم'); return 0; })();
    const pendingOrders = results[2].status === 'fulfilled' ? results[2].value : (() => { warnings.push('تعذر حساب الطلبات المعلقة'); return 0; })();
    const preparingOrders = results[3].status === 'fulfilled' ? results[3].value : (() => { warnings.push('تعذر حساب الطلبات قيد التحضير'); return 0; })();
    const totalActiveProducts = results[4].status === 'fulfilled' ? results[4].value : (() => { warnings.push('تعذر حساب المنتجات النشطة'); return 0; })();
    const totalCustomers = results[5].status === 'fulfilled' ? results[5].value : (() => { warnings.push('تعذر حساب العملاء'); return 0; })();
    const topProducts = results[6].status === 'fulfilled' ? results[6].value : (() => { warnings.push('تعذر حساب أفضل المنتجات'); return []; })();

    const allFailed = results.every(r => r.status === 'rejected');
    if (allFailed) {
      throw new InternalServerErrorException('تعذر تحميل بيانات لوحة التحكم');
    }

    return {
      todayOrders: todayOrdersCount,
      todayRevenue,
      pendingOrders,
      preparingOrders,
      totalActiveProducts,
      totalCustomers,
      topProducts,
      warnings: warnings.length > 0 ? warnings : undefined,
      generatedAt: new Date().toISOString(),
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

  async updateOrderStatus(id: string, status: string, reason?: string, changedBy?: string, auditContext?: AuditLogContext) {
    return this.ordersService.updateStatus(id, status, reason, changedBy, auditContext);
  }
}
