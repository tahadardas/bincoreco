import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import * as uuid from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private loyaltyService: LoyaltyService,
  ) {}

  async create(customerId: string, input: { pickupTime: string; notes?: string }) {
    const cart = await this.cartService.getCart(customerId);
    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const currencyCode = 'SYP';
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of cart.items) {
      let unitPrice = 0;
      if (item.variant && item.variant.prices.length > 0) {
        unitPrice = item.variant.prices[0].amount;
      } else if (item.product.variants.length > 0 && item.product.variants[0].prices.length > 0) {
        unitPrice = item.product.variants[0].prices[0].amount;
      }

      const total = unitPrice * item.quantity;
      subtotal += total;

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        productNameSnapshot: item.product.translations[0]?.name || 'Product',
        variantSnapshot: item.variant ? { name: item.variant.name, sizeValue: item.variant.sizeValue, sizeUnit: item.variant.sizeUnit } : null,
        selectedOptionsSnapshot: item.selectedOptions,
        unitPrice,
        quantity: item.quantity,
        total,
      });
    }

    const orderNumber = `BR-${Date.now().toString(36).toUpperCase()}-${uuid.v4().slice(0, 4).toUpperCase()}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId,
        currencyCode,
        subtotal,
        total: subtotal,
        pickupTime: new Date(input.pickupTime),
        notes: input.notes,
        items: { create: orderItems },
        statusHistory: {
          create: { toStatus: 'PENDING' },
        },
      },
      include: { items: true, statusHistory: true },
    });

    await this.cartService.clearCart(customerId);
    return order;
  }

  async findByCustomer(customerId: string, params: { page?: number; limit?: number; status?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { customerId };
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.fromDate || params.toDate) {
      where.createdAt = {};
      if (params.fromDate) where.createdAt.gte = new Date(params.fromDate);
      if (params.toDate) where.createdAt.lte = new Date(params.toDate);
    }
    if (params.search) {
      where.OR = [
        { orderNumber: { contains: params.search, mode: 'insensitive' } },
        { customer: { fullName: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
          customer: { select: { id: true, fullName: true, phone: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async updateStatus(id: string, status: string, reason?: string, changedBy?: string) {
    const order = await this.findById(id);
    const validTransitions: Record<string, string[]> = {
      PENDING: ['ACCEPTED', 'CANCELLED'],
      ACCEPTED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
      READY_FOR_PICKUP: ['PICKED_UP', 'CANCELLED'],
      PICKED_UP: [],
      CANCELLED: [],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${status}`);
    }

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus: order.status as any,
        toStatus: status as any,
        changedBy,
        reason,
      },
    });

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: status as any, cancellationReason: status === 'CANCELLED' ? reason : undefined },
      include: { items: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
    });

    if (status === 'PICKED_UP') {
      const points = Math.floor(updated.total / 1000);
      if (points > 0) {
        await this.loyaltyService.awardPoints(order.customerId, points, `Order ${order.orderNumber}`, id);
      }
      await this.loyaltyService.awardStamp(order.customerId, id);
    }

    return updated;
  }
}
