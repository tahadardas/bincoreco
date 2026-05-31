import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type DateRangeParams = {
  fromDate?: string;
  toDate?: string;
  limit?: number;
};

type PreparationOrder = {
  status: OrderStatus;
  statusHistory: {
    toStatus: OrderStatus;
    createdAt: Date;
  }[];
};

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getTopProducts(params: DateRangeParams) {
    const limit = params.limit || 20;
    const where: Prisma.OrderItemWhereInput = {
      order: this.buildRevenueOrderWhere(params),
    };

    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId', 'productNameSnapshot', 'currencyCode'],
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
        currencyCode: item.currencyCode,
        totalRevenue: this.decimalToNumber(item._sum.total),
      };
    });
  }

  async getDailySales(params: DateRangeParams) {
    const orders = await this.prisma.order.findMany({
      where: this.buildOrderWhere(params),
      select: {
        id: true,
        status: true,
        total: true,
        currencyCode: true,
        createdAt: true,
        statusHistory: {
          select: {
            toStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalRevenue = orders
      .filter(order => this.isRevenueOrder(order.status))
      .reduce((sum, o) => sum + this.decimalToNumber(o.total), 0);

    const byStatus = this.createStatusCountMap();
    for (const order of orders) {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;
    }

    const preparation = this.calculatePreparationMetrics(orders);

    return {
      totalOrders: orders.length,
      totalRevenue,
      revenueByCurrency: this.sumRevenueByCurrency(orders),
      dailySales: this.buildDailySalesSeries(orders),
      ordersByStatus: byStatus,
      averagePreparationTime: preparation.averageMinutes,
      preparationSampleSize: preparation.sampleSize,
      cancelledOrders: byStatus[OrderStatus.CANCELLED] || 0,
    };
  }

  async getOrdersByStatus(params: DateRangeParams) {
    const rows = await this.prisma.order.groupBy({
      by: ['status'],
      where: this.buildOrderWhere(params),
      _count: { _all: true },
      orderBy: { status: 'asc' },
    });
    const counts = this.createStatusCountMap();
    for (const row of rows) {
      counts[row.status] = row._count._all;
    }

    return {
      counts,
      items: Object.values(OrderStatus).map(status => ({
        status,
        count: counts[status] || 0,
      })),
    };
  }

  async getCancelledOrders(params: DateRangeParams) {
    const limit = params.limit || 20;
    const where = this.buildOrderWhere(params, { status: OrderStatus.CANCELLED });

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          currencyCode: true,
          cancellationReason: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
          statusHistory: {
            where: { toStatus: OrderStatus.CANCELLED },
            select: { createdAt: true, reason: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      total,
      items: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer,
        total: this.decimalToNumber(order.total),
        currencyCode: order.currencyCode,
        cancellationReason: order.cancellationReason || order.statusHistory[0]?.reason || null,
        createdAt: order.createdAt,
        cancelledAt: order.statusHistory[0]?.createdAt || order.updatedAt,
      })),
    };
  }

  async getAveragePreparationTime(params: DateRangeParams) {
    const orders = await this.prisma.order.findMany({
      where: this.buildOrderWhere(params, {
        status: { in: [OrderStatus.READY_FOR_PICKUP, OrderStatus.PICKED_UP] },
      }),
      select: {
        status: true,
        statusHistory: {
          select: {
            toStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return this.calculatePreparationMetrics(orders);
  }

  async getRevenueByDateRange(params: DateRangeParams) {
    const rows = await this.prisma.order.groupBy({
      by: ['currencyCode'],
      where: this.buildRevenueOrderWhere(params),
      _count: { _all: true },
      _sum: { total: true },
      orderBy: { currencyCode: 'asc' },
    });

    const totalsByCurrency = rows.map(row => ({
      currencyCode: row.currencyCode,
      totalRevenue: this.decimalToNumber(row._sum.total),
      orderCount: row._count._all,
    }));

    return {
      totalRevenue: totalsByCurrency.reduce((sum, row) => sum + row.totalRevenue, 0),
      orderCount: totalsByCurrency.reduce((sum, row) => sum + row.orderCount, 0),
      totalsByCurrency,
    };
  }

  private buildOrderWhere(params: DateRangeParams, base: Prisma.OrderWhereInput = {}) {
    const where: Prisma.OrderWhereInput = { ...base };
    const createdAt = this.buildCreatedAtFilter(params);
    if (createdAt) {
      where.createdAt = createdAt;
    }
    return where;
  }

  private buildRevenueOrderWhere(params: DateRangeParams) {
    return this.buildOrderWhere(params, {
      status: { not: OrderStatus.CANCELLED },
    });
  }

  private buildCreatedAtFilter(params: DateRangeParams) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (params.fromDate) {
      createdAt.gte = new Date(params.fromDate);
    }
    if (params.toDate) {
      createdAt.lte = new Date(params.toDate);
    }
    return Object.keys(createdAt).length ? createdAt : undefined;
  }

  private createStatusCountMap() {
    return Object.values(OrderStatus).reduce<Record<OrderStatus, number>>((counts, status) => {
      counts[status] = 0;
      return counts;
    }, {} as Record<OrderStatus, number>);
  }

  private isRevenueOrder(status: OrderStatus) {
    return status !== OrderStatus.CANCELLED;
  }

  private sumRevenueByCurrency(orders: { status: OrderStatus; total: Prisma.Decimal | number | string; currencyCode: string }[]) {
    return orders.reduce<Record<string, number>>((totals, order) => {
      if (!this.isRevenueOrder(order.status)) {
        return totals;
      }
      totals[order.currencyCode] = (totals[order.currencyCode] || 0) + this.decimalToNumber(order.total);
      return totals;
    }, {});
  }

  private buildDailySalesSeries(
    orders: { createdAt: Date; status: OrderStatus; total: Prisma.Decimal | number | string; currencyCode: string }[],
  ) {
    const series = new Map<string, {
      date: string;
      totalOrders: number;
      cancelledOrders: number;
      totalRevenue: number;
      revenueByCurrency: Record<string, number>;
    }>();

    for (const order of orders) {
      const date = order.createdAt.toISOString().slice(0, 10);
      const row = series.get(date) || {
        date,
        totalOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        revenueByCurrency: {},
      };

      row.totalOrders += 1;
      if (order.status === OrderStatus.CANCELLED) {
        row.cancelledOrders += 1;
      } else {
        const total = this.decimalToNumber(order.total);
        row.totalRevenue += total;
        row.revenueByCurrency[order.currencyCode] = (row.revenueByCurrency[order.currencyCode] || 0) + total;
      }

      series.set(date, row);
    }

    return Array.from(series.values());
  }

  private calculatePreparationMetrics(orders: PreparationOrder[]) {
    const durations = orders.flatMap(order => {
      if (order.status === OrderStatus.CANCELLED) {
        return [];
      }

      const start = order.statusHistory.find(history =>
        history.toStatus === OrderStatus.ACCEPTED || history.toStatus === OrderStatus.PREPARING,
      );
      if (!start) {
        return [];
      }

      const end = order.statusHistory.find(history =>
        history.createdAt >= start.createdAt &&
        (history.toStatus === OrderStatus.READY_FOR_PICKUP || history.toStatus === OrderStatus.PICKED_UP),
      );
      if (!end) {
        return [];
      }

      const minutes = (end.createdAt.getTime() - start.createdAt.getTime()) / 60_000;
      return minutes >= 0 ? [minutes] : [];
    });

    const totalMinutes = durations.reduce((sum, minutes) => sum + minutes, 0);
    const averageMinutes = durations.length ? Math.round(totalMinutes / durations.length) : 0;

    return {
      averageMinutes,
      sampleSize: durations.length,
    };
  }

  private decimalToNumber(value: Prisma.Decimal | number | string | null | undefined) {
    if (value === null || value === undefined) {
      return 0;
    }

    return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
  }
}
