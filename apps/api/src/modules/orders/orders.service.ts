import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma, ProductType } from '@prisma/client';
import { CreateOrderInput, CreateGuestOrderInput } from '@banco-ricco/validators';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { GuestCartService } from '../guest-cart/guest-cart.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { AuditActions, AuditLogContext } from '../audit-logs/audit-log.types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CurrenciesService } from '../currencies/currencies.service';
import * as uuid from 'uuid';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private guestCartService: GuestCartService,
    private loyaltyService: LoyaltyService,
    private auditLogs: AuditLogsService,
    private currenciesService: CurrenciesService,
    private jwtService: JwtService,
  ) {}

  async create(customerId: string, input: CreateOrderInput) {
    const cart = await this.cartService.getCart(customerId);
    if (!cart.items.length) throw new BadRequestException('Cart is empty');

    await this.validatePickupAvailability(cart.items, input.pickupTime);

    const { currencyCode, subtotal, orderItems } = await this.buildOrderItems(cart.items, input.currencyCode || cart.currencyCode);
    const orderNumber = this.generateOrderNumber();
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId,
        currencyCode,
        subtotal,
        total: subtotal,
        pickupTime: this.parsePickupTime(input.pickupTime),
        notes: input.notes,
        items: { create: orderItems },
        statusHistory: { create: { toStatus: 'PENDING' } },
      },
      include: { items: true, statusHistory: true },
    });

    await this.cartService.clearCart(customerId);
    return order;
  }

  async createGuest(input: CreateGuestOrderInput) {
    const cart = await this.guestCartService.getCart(input.sessionId);
    if (!cart.items.length) throw new BadRequestException('Cart is empty');

    await this.validatePickupAvailability(cart.items, input.pickupTime);

    const { currencyCode, subtotal, orderItems } = await this.buildOrderItems(cart.items, input.currencyCode || cart.currencyCode);
    const orderNumber = this.generateOrderNumber();
    const rewardClaimToken = uuid.v4().replace(/-/g, '').substring(0, 24);

    const points = await this.loyaltyService.calculateLoyaltyPoints(subtotal, currencyCode);

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        guestName: input.guestName,
        guestPhone: input.guestPhone,
        guestSessionId: input.sessionId,
        rewardClaimToken,
        pendingCoins: points,
        pendingStamps: 1,
        currencyCode,
        subtotal,
        total: subtotal,
        pickupTime: this.parsePickupTime(input.pickupTime),
        notes: input.notes,
        items: { create: orderItems },
        statusHistory: { create: { toStatus: 'PENDING' } },
      },
      include: { items: true, statusHistory: true },
    });

    await this.guestCartService.clearCart(input.sessionId);
    return { ...order, rewardClaimToken };
  }

  async claimReward(token: string, input: { email?: string; phone?: string; password: string; fullName: string }) {
    const order = await this.prisma.order.findUnique({ where: { rewardClaimToken: token } });
    if (!order) throw new NotFoundException('Invalid reward claim token');
    if (order.rewardClaimedAt) throw new BadRequestException('Reward already claimed');
    if (order.customerId) throw new BadRequestException('Order already linked to a registered user');
    if (order.status !== 'PICKED_UP') throw new BadRequestException('Order must be picked up before claiming rewards');

    if (order.guestPhone && input.phone && order.guestPhone !== input.phone) {
      throw new BadRequestException('رقم الهاتف لا يطابق رقم هاتف الطلب');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email || undefined },
          { phone: input.phone || undefined },
        ].filter(cond => Object.values(cond)[0] !== undefined),
      },
    });
    if (existingUser) {
      throw new ConflictException('يوجد حساب مسبق بهذا البريد أو الهاتف، الرجاء تسجيل الدخول أولاً');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash: hashedPassword,
        fullName: input.fullName || order.guestName || 'Guest',
        role: 'customer',
      },
    });

    const profile = await this.prisma.customerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        customerId: user.id,
        rewardClaimedAt: new Date(),
        pendingCoins: 0,
        pendingStamps: 0,
      },
    });

    if (order.pendingCoins > 0) {
      await this.loyaltyService.awardPoints(user.id, order.pendingCoins, `Claimed guest rewards for order ${order.orderNumber}`, order.id);
    }
    if (order.pendingStamps > 0) {
      for (let i = 0; i < order.pendingStamps; i++) {
        await this.loyaltyService.awardStamp(user.id, order.id);
      }
    }

    await this.auditLogs.record({
      action: AuditActions.REWARD_CLAIMED,
      entityType: 'Order',
      entityId: order.id,
      afterSnapshot: { userId: user.id, orderNumber: order.orderNumber },
    });

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d' },
    );

    return {
      user: { id: user.id, email: user.email, phone: user.phone, fullName: user.fullName, role: user.role },
      accessToken,
      refreshToken,
      pendingCoins: order.pendingCoins,
      pendingStamps: order.pendingStamps,
    };
  }

  async claimRewardAuthenticated(userId: string, token: string) {
    const order = await this.prisma.order.findUnique({ where: { rewardClaimToken: token } });
    if (!order) throw new NotFoundException('Invalid reward claim token');
    if (order.rewardClaimedAt) throw new BadRequestException('Reward already claimed');
    if (order.customerId) throw new BadRequestException('Order already linked to a registered user');
    if (order.status !== 'PICKED_UP') throw new BadRequestException('Order must be picked up before claiming rewards');

    if (order.guestPhone) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.phone !== order.guestPhone) {
        throw new ForbiddenException('رقم هاتف الحساب لا يطابق رقم هاتف الطلب');
      }
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        customerId: userId,
        rewardClaimedAt: new Date(),
        pendingCoins: 0,
        pendingStamps: 0,
      },
    });

    if (order.pendingCoins > 0) {
      await this.loyaltyService.awardPoints(userId, order.pendingCoins, `Claimed guest rewards for order ${order.orderNumber}`, order.id);
    }
    if (order.pendingStamps > 0) {
      for (let i = 0; i < order.pendingStamps; i++) {
        await this.loyaltyService.awardStamp(userId, order.id);
      }
    }

    await this.auditLogs.record({
      action: AuditActions.REWARD_CLAIMED,
      entityType: 'Order',
      entityId: order.id,
      afterSnapshot: { userId, orderNumber: order.orderNumber },
    });

    return { message: 'Rewards claimed successfully', pendingCoins: order.pendingCoins, pendingStamps: order.pendingStamps };
  }

  private async buildOrderItems(
    items: any[],
    currencyCode: string,
  ) {
    const resolvedCurrency = currencyCode || await this.currenciesService.getDefaultCurrencyCode();
    let subtotal = new Prisma.Decimal(0);
    const orderItems: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];

    for (const item of items) {
      const productName = item.product.translations[0]?.name || item.product.sku;
      const variant = item.variant || item.product.variants[0];
      if (!variant) throw new BadRequestException(`Product ${productName} has no active variant`);

      const price = variant.prices.find((p: any) => p.currencyCode === resolvedCurrency && p.isActive);
      if (!price) throw new BadRequestException(`No active ${resolvedCurrency} price is configured for ${productName}`);

      const unitPrice = new Prisma.Decimal(price.amount);
      const total = unitPrice.mul(item.quantity);
      subtotal = subtotal.plus(total);
      const grindSnapshot = this.resolveGrindSnapshot(item);

      orderItems.push({
        productId: item.productId,
        variantId: variant.id,
        productNameSnapshot: productName,
        variantSnapshot: { name: variant.name, sizeValue: variant.sizeValue, sizeUnit: variant.sizeUnit },
        selectedOptionsSnapshot: grindSnapshot.selectedOptions as Prisma.InputJsonValue | undefined,
        grindType: grindSnapshot.grindType,
        grindOptionId: grindSnapshot.grindOptionId,
        grindOptionNameAr: grindSnapshot.grindOptionNameAr,
        grindOptionNameEn: grindSnapshot.grindOptionNameEn,
        unitPrice,
        currencyCode: resolvedCurrency,
        quantity: item.quantity,
        total,
      });
    }

    return { currencyCode: resolvedCurrency, subtotal, orderItems };
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
      include: { items: true, statusHistory: { orderBy: { createdAt: 'desc' } }, customer: { select: { id: true, fullName: true, phone: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByOrderNumberAndPhone(orderNumber: string, phone: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true, statusHistory: { orderBy: { createdAt: 'desc' } }, customer: { select: { id: true, fullName: true, phone: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    const orderPhone = order.guestPhone || order.customer?.phone;
    if (orderPhone !== phone) throw new NotFoundException('Order not found for this phone');
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
        { guestName: { contains: params.search, mode: 'insensitive' } },
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

  async updateStatus(id: string, status: string, reason?: string, changedBy?: string, auditContext?: AuditLogContext) {
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
    if (!allowed.includes(status)) throw new BadRequestException(`Cannot transition from ${order.status} to ${status}`);

    const updated = await this.prisma.$transaction(async tx => {
      const current = await tx.order.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Order not found');
      if (current.status !== order.status) {
        throw new BadRequestException(`Order status changed from ${order.status} to ${current.status}. Reload and retry.`);
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: current.status,
          toStatus: status as any,
          changedBy,
          reason,
        },
      });

      const nextOrder = await tx.order.update({
        where: { id },
        data: { status: status as any, cancellationReason: status === 'CANCELLED' ? reason : undefined },
        include: { items: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
      });

      if (current.status !== 'PICKED_UP' && status === 'PICKED_UP' && current.customerId) {
        await this.awardPickupRewards(tx, current.customerId, id, current.orderNumber, current.total, current.currencyCode);
      }

      return nextOrder;
    });

    await this.auditLogs.record({
      ...auditContext,
      actorUserId: changedBy || auditContext?.actorUserId,
      action: AuditActions.ORDER_STATUS_CHANGED,
      entityType: 'Order',
      entityId: id,
      beforeSnapshot: { status: order.status, cancellationReason: order.cancellationReason },
      afterSnapshot: { status: updated.status, cancellationReason: updated.cancellationReason, reason },
    });

    return updated;
  }

  private async awardPickupRewards(
    tx: Prisma.TransactionClient,
    userId: string,
    orderId: string,
    orderNumber: string,
    total: Prisma.Decimal,
    currencyCode: string,
  ) {
    const existingEarn = await tx.loyaltyTransaction.findFirst({
      where: { orderId, type: 'EARN' },
    });
    const existingStamp = await tx.loyaltyTransaction.findFirst({
      where: { orderId, type: 'STAMP' },
    });

    if (existingEarn && existingStamp) return;

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'customer') return;

    const profile = await tx.customerProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    const account = await tx.loyaltyAccount.upsert({
      where: { customerId: profile.id },
      update: {},
      create: { customerId: profile.id },
    });

    if (!existingEarn) {
      const points = await this.loyaltyService.calculateLoyaltyPoints(total, currencyCode);
      if (points > 0) {
        await tx.loyaltyAccount.update({
          where: { id: account.id },
          data: {
            balance: { increment: points },
            lifetimeEarned: { increment: points },
          },
        });
        await tx.loyaltyTransaction.create({
          data: {
            loyaltyAccountId: account.id,
            type: 'EARN',
            points,
            reason: `Order ${orderNumber}`,
            orderId,
          },
        });
      }
    }

    if (!existingStamp) {
      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          stampCount: { increment: 1 },
          stampTotalEarned: { increment: 1 },
        },
      });
      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          type: 'STAMP',
          points: 1,
          reason: 'New stamp earned',
          orderId,
        },
      });
    }
  }

  private async validatePickupAvailability(
    items: { product: { basePreparationTimeMinutes: number }; quantity: number }[],
    pickupTimeInput: string,
  ) {
    const pickupEnabled = await this.getSettingValue('pickup_enabled', 'true');
    if (pickupEnabled === 'false') throw new BadRequestException('الطلبات مؤقتاً غير متاحة بسبب الازدحام');

    const pickupTime = this.parsePickupTime(pickupTimeInput);
    const now = new Date();
    if (pickupTime <= now) throw new BadRequestException('Pickup time cannot be in the past');

    const defaultPreparationTime = Number(await this.getSettingValue('default_preparation_time', '15'));
    const productPreparationTime = Math.max(
      ...items.map(item => item.product.basePreparationTimeMinutes * Math.max(1, item.quantity)),
    );
    const minimumPreparationMinutes = Math.max(defaultPreparationTime || 15, productPreparationTime);
    const earliestPickupTime = new Date(now.getTime() + minimumPreparationMinutes * 60_000);

    if (pickupTime < earliestPickupTime) {
      throw new BadRequestException(`Pickup time must be at least ${minimumPreparationMinutes} minutes from now`);
    }
  }

  private parsePickupTime(value: string) {
    const pickupTime = new Date(value);
    if (Number.isNaN(pickupTime.getTime())) throw new BadRequestException('Invalid pickup time');
    return pickupTime;
  }

  private async getSettingValue(key: string, fallback: string) {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    return setting?.value || fallback;
  }

  private resolveGrindSnapshot(item: {
    product: { type: ProductType; grindOptions: { grindOptionId: string; isActive: boolean; grindOption: { isActive: boolean; nameAr: string; nameEn: string } }[] };
    selectedOptions: Prisma.JsonValue | null;
  }) {
    const selectedOptions = this.getSelectedOptionsRecord(item.selectedOptions);

    if (item.product.type !== ProductType.COFFEE_BEAN && item.product.type !== ProductType.GROUND_COFFEE) {
      if (selectedOptions.grindType || selectedOptions.grindOptionId) {
        throw new BadRequestException('Grind options can only be selected for coffee bean products');
      }
      return {
        selectedOptions: Object.keys(selectedOptions).length ? selectedOptions : undefined,
        grindType: undefined, grindOptionId: undefined, grindOptionNameAr: undefined, grindOptionNameEn: undefined,
      };
    }

    const grindType = item.product.type === ProductType.GROUND_COFFEE
      ? 'ground'
      : selectedOptions.grindType || 'whole_bean';

    if (item.product.type === ProductType.GROUND_COFFEE && selectedOptions.grindType && selectedOptions.grindType !== 'ground') {
      throw new BadRequestException('Ground coffee requires a grind option');
    }

    if (grindType === 'whole_bean') {
      const snapshot: Record<string, unknown> = { ...selectedOptions, grindType: 'whole_bean' };
      delete snapshot.grindOptionId;
      delete snapshot.grindOptionNameAr;
      delete snapshot.grindOptionNameEn;
      return { selectedOptions: snapshot, grindType: 'whole_bean', grindOptionId: undefined, grindOptionNameAr: undefined, grindOptionNameEn: undefined };
    }

    if (grindType !== 'ground') throw new BadRequestException('Invalid grind type');
    if (typeof selectedOptions.grindOptionId !== 'string') throw new BadRequestException('اختر طريقة الطحن أولاً');

    const linkedGrindOption = item.product.grindOptions.find(link =>
      link.grindOptionId === selectedOptions.grindOptionId && link.isActive && link.grindOption.isActive,
    );
    if (!linkedGrindOption) throw new BadRequestException('Selected grind option is not available for this product');

    return {
      selectedOptions: { ...selectedOptions, grindType: 'ground', grindOptionId: linkedGrindOption.grindOptionId, grindOptionNameAr: linkedGrindOption.grindOption.nameAr, grindOptionNameEn: linkedGrindOption.grindOption.nameEn },
      grindType: 'ground',
      grindOptionId: linkedGrindOption.grindOptionId,
      grindOptionNameAr: linkedGrindOption.grindOption.nameAr,
      grindOptionNameEn: linkedGrindOption.grindOption.nameEn,
    };
  }

  private getSelectedOptionsRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
    if (!value || Array.isArray(value) || typeof value !== 'object') return {};
    return { ...(value as Record<string, unknown>) };
  }

  private generateOrderNumber() {
    return `BR-${Date.now().toString(36).toUpperCase()}-${uuid.v4().slice(0, 4).toUpperCase()}`;
  }

  private decimalToNumber(value: Prisma.Decimal | number | string) {
    return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
  }
}
