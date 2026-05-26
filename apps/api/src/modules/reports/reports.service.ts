import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getTopProducts(params: { fromDate?: string; toDate?: string; limit?: number }) {
    const limit = params.limit || 20;
    const where: any = {};
    if (params.fromDate || params.toDate) {
      where.order = {};
      if (params.fromDate) where.order.createdAt = { gte: new Date(params.fromDate) };
      if (params.toDate) where.order.createdAt = { lte: new Date(params.toDate) };
    }

    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId', 'productNameSnapshot'],
      where,
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const products = await this.prisma.product.findMany({
      where: { id: { in: topProducts.map(p => p.productId) } },
      select: { id: true, sku: true, imageUrl: true },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    return topProducts.map(item => {
      const product = productMap.get(item.productId);
      return {
        productId: item.productId,
        productName: item.productNameSnapshot,
        sku: product?.sku || '',
        imageUrl: product?.imageUrl || null,
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: item._sum.total || 0,
      };
    });
  }

  async getDailySales(params: { fromDate?: string; toDate?: string }) {
    const fromDate = params.fromDate ? new Date(params.fromDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const toDate = params.toDate ? new Date(params.toDate) : new Date(new Date().setHours(23, 59, 59, 999));

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalRevenue = orders
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.total, 0);

    const byStatus: Record<string, number> = {};
    for (const order of orders) {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;
    }

    const totalPreparationTime = orders
      .filter(o => o.status === 'PICKED_UP' || o.status === 'READY_FOR_PICKUP')
      .reduce((sum, o) => {
        const accepted = o.statusHistory.find((h: any) => h.toStatus === 'ACCEPTED');
        if (accepted) {
          return sum + (o.updatedAt.getTime() - accepted.createdAt.getTime()) / 60000;
        }
        return sum;
      }, 0);

    const completedOrders = orders.filter(o => o.status === 'PICKED_UP').length;

    return {
      totalOrders: orders.length,
      totalRevenue,
      ordersByStatus: byStatus,
      averagePreparationTime: completedOrders > 0 ? Math.round(totalPreparationTime / completedOrders) : 0,
      cancelledOrders: byStatus['CANCELLED'] || 0,
    };
  }
}
