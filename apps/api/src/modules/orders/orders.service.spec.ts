import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, ProductType } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { GuestCartService } from '../guest-cart/guest-cart.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { CurrenciesService } from '../currencies/currencies.service';

function createOrderService(cart: unknown) {
  const prisma: any = {
    setting: {
      findUnique: jest.fn(async ({ where }: { where: { key: string } }) => {
        const settings: Record<string, string> = {
          default_currency: 'SYP',
          pickup_enabled: 'true',
          default_preparation_time: '15',
        };
        return { key: where.key, value: settings[where.key] };
      }),
    },
    order: {
      create: jest.fn(async ({ data }: { data: unknown }) => data),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    customerProfile: {
      upsert: jest.fn(),
    },
    loyaltyAccount: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
    loyaltyTransaction: {
      create: jest.fn(),
    },
    qRCard: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn(async (fn: any) => fn(prisma)),
  } as unknown as PrismaService;

  const cartService = {
    getCart: jest.fn().mockResolvedValue(cart),
    clearCart: jest.fn().mockResolvedValue(undefined),
  } as unknown as CartService;

  const guestCartService = {
    getCart: jest.fn().mockResolvedValue(cart),
    clearCart: jest.fn().mockResolvedValue(undefined),
  } as unknown as GuestCartService;

  const loyaltyService = {
    calculateLoyaltyPoints: jest.fn().mockResolvedValue(10),
    awardPoints: jest.fn().mockResolvedValue(undefined),
    awardStamp: jest.fn().mockResolvedValue(undefined),
  } as unknown as LoyaltyService;

  const currenciesService = { getDefaultCurrencyCode: jest.fn().mockResolvedValue('SYP') } as unknown as CurrenciesService;
  const auditLogs = { record: jest.fn().mockResolvedValue(undefined) };
  const jwtService = new JwtService({ secret: 'test' });

  return {
    service: new OrdersService(prisma, cartService, guestCartService, loyaltyService, auditLogs as any, currenciesService, jwtService),
    prisma,
    cartService,
    guestCartService,
  };
}

const baseCartItem = {
  productId: 'product-1',
  variantId: 'variant-1',
  quantity: 2,
  selectedOptions: null,
  product: {
    sku: 'BR-ESP-001',
    type: ProductType.HOT_DRINK,
    basePreparationTimeMinutes: 5,
    translations: [{ name: 'Espresso' }],
    variants: [],
    grindOptions: [],
  },
};

describe('OrdersService pricing', () => {
  it('rejects an order item when the selected currency has no active price', async () => {
    const cart = {
      id: 'cart-1',
      currencyCode: 'SYP',
      items: [{
        ...baseCartItem,
        variant: {
          id: 'variant-1',
          name: 'Double',
          sizeValue: null,
          sizeUnit: null,
          prices: [{ currencyCode: 'USD', isActive: true, amount: new Prisma.Decimal(3) }],
        },
      }],
    };
    const { service } = createOrderService(cart);

    await expect(service.create('customer-1', {
      pickupTime: new Date(Date.now() + 30 * 60_000).toISOString(),
    })).rejects.toThrow(BadRequestException);
  });

  it('creates order item totals using Decimal and selected currency snapshots', async () => {
    const cart = {
      id: 'cart-1',
      currencyCode: 'SYP',
      items: [{
        ...baseCartItem,
        variant: {
          id: 'variant-1',
          name: 'Double',
          sizeValue: null,
          sizeUnit: null,
          prices: [{ currencyCode: 'SYP', isActive: true, amount: new Prisma.Decimal(25000) }],
        },
      }],
    };
    const { service, prisma } = createOrderService(cart);

    await service.create('customer-1', {
      pickupTime: new Date(Date.now() + 30 * 60_000).toISOString(),
    });

    expect(prisma.order.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        currencyCode: 'SYP',
        subtotal: new Prisma.Decimal(50000),
        total: new Prisma.Decimal(50000),
        items: {
          create: [expect.objectContaining({
            unitPrice: new Prisma.Decimal(25000),
            currencyCode: 'SYP',
            total: new Prisma.Decimal(50000),
          })],
        },
      }),
    }));
  });

  it('rejects empty cart for authenticated order', async () => {
    const cart = { id: 'cart-1', currencyCode: 'SYP', items: [] };
    const { service } = createOrderService(cart);

    await expect(service.create('customer-1', {
      pickupTime: new Date(Date.now() + 30 * 60_000).toISOString(),
    })).rejects.toThrow(BadRequestException);
  });

  it('rejects pickup in the past', async () => {
    const cart = {
      id: 'cart-1', currencyCode: 'SYP',
      items: [{
        ...baseCartItem,
        variant: {
          id: 'variant-1', name: 'Single', sizeValue: null, sizeUnit: null,
          prices: [{ currencyCode: 'SYP', isActive: true, amount: new Prisma.Decimal(10000) }],
        },
      }],
    };
    const { service } = createOrderService(cart);

    await expect(service.create('customer-1', {
      pickupTime: new Date(Date.now() - 60_000).toISOString(),
    })).rejects.toThrow(BadRequestException);
  });

  it('rejects pickup earlier than calculated preparation time', async () => {
    const cart = {
      id: 'cart-1', currencyCode: 'SYP',
      items: [{
        ...baseCartItem,
        quantity: 5,
        product: {
          ...baseCartItem.product,
          basePreparationTimeMinutes: 10,
        },
        variant: {
          id: 'variant-1', name: 'Single', sizeValue: null, sizeUnit: null,
          prices: [{ currencyCode: 'SYP', isActive: true, amount: new Prisma.Decimal(10000) }],
        },
      }],
    };
    const { service } = createOrderService(cart);

    await expect(service.create('customer-1', {
      pickupTime: new Date(Date.now() + 5 * 60_000).toISOString(),
    })).rejects.toThrow(BadRequestException);
  });

  it('accepts pickup after calculated preparation time', async () => {
    const cart = {
      id: 'cart-1', currencyCode: 'SYP',
      items: [{
        ...baseCartItem,
        variant: {
          id: 'variant-1', name: 'Single', sizeValue: null, sizeUnit: null,
          prices: [{ currencyCode: 'SYP', isActive: true, amount: new Prisma.Decimal(10000) }],
        },
      }],
    };
    const { service, prisma } = createOrderService(cart);

    await service.create('customer-1', {
      pickupTime: new Date(Date.now() + 30 * 60_000).toISOString(),
    });

    expect(prisma.order.create).toHaveBeenCalled();
  });

  it('clears cart after authenticated order creation', async () => {
    const cart = {
      id: 'cart-1', currencyCode: 'SYP',
      items: [{
        ...baseCartItem,
        variant: {
          id: 'variant-1', name: 'Single', sizeValue: null, sizeUnit: null,
          prices: [{ currencyCode: 'SYP', isActive: true, amount: new Prisma.Decimal(10000) }],
        },
      }],
    };
    const { service, cartService } = createOrderService(cart);

    await service.create('customer-1', {
      pickupTime: new Date(Date.now() + 30 * 60_000).toISOString(),
    });

    expect(cartService.clearCart).toHaveBeenCalledWith('customer-1');
  });
});

describe('OrdersService guest orders', () => {
  it('creates guest order with reward claim token', async () => {
    const cart = {
      id: 'guest-cart-1', currencyCode: 'SYP',
      items: [{
        ...baseCartItem,
        variant: {
          id: 'variant-1', name: 'Single', sizeValue: null, sizeUnit: null,
          prices: [{ currencyCode: 'SYP', isActive: true, amount: new Prisma.Decimal(10000) }],
        },
      }],
    };
    const { service, prisma } = createOrderService(cart);

    const result = await service.createGuest({
      sessionId: 'session-1',
      guestName: 'Test Guest',
      guestPhone: '0933333333',
      pickupTime: new Date(Date.now() + 30 * 60_000).toISOString(),
    });

    expect(result.rewardClaimToken).toBeDefined();
    expect(result.guestName).toBe('Test Guest');
    expect(result.guestPhone).toBe('0933333333');
    expect(result.pendingCoins).toBe(10);
    expect(result.pendingStamps).toBe(1);
    expect(prisma.order.create).toHaveBeenCalled();
  });

  it('clears guest cart after order creation', async () => {
    const cart = {
      id: 'guest-cart-1', currencyCode: 'SYP',
      items: [{
        ...baseCartItem,
        variant: {
          id: 'variant-1', name: 'Single', sizeValue: null, sizeUnit: null,
          prices: [{ currencyCode: 'SYP', isActive: true, amount: new Prisma.Decimal(10000) }],
        },
      }],
    };
    const { service, guestCartService } = createOrderService(cart);

    await service.createGuest({
      sessionId: 'session-1',
      guestName: 'Test Guest',
      guestPhone: '0933333333',
      pickupTime: new Date(Date.now() + 30 * 60_000).toISOString(),
    });

    expect(guestCartService.clearCart).toHaveBeenCalledWith('session-1');
  });
});

describe('OrdersService reward claiming', () => {
  const makeOrder = (overrides = {}) => ({
    id: 'order-1',
    orderNumber: 'BR-TEST-001',
    customerId: null,
    guestName: 'Guest',
    guestPhone: '0933333333',
    status: 'PICKED_UP',
    rewardClaimToken: 'valid-token-123',
    rewardClaimedAt: null,
    pendingCoins: 50,
    pendingStamps: 2,
    total: new Prisma.Decimal(50000),
    currencyCode: 'SYP',
    ...overrides,
  });

  it('rejects invalid reward claim token', async () => {
    const { service, prisma } = createOrderService(null);
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.claimReward('invalid-token', {
      fullName: 'Test',
      password: 'pass123',
    })).rejects.toThrow(NotFoundException);
  });

  it('rejects already claimed rewards', async () => {
    const { service, prisma } = createOrderService(null);
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(makeOrder({ rewardClaimedAt: new Date() }));

    await expect(service.claimReward('valid-token-123', {
      fullName: 'Test',
      password: 'pass123',
    })).rejects.toThrow(BadRequestException);
  });

  it('rejects claim before PICKED_UP', async () => {
    const { service, prisma } = createOrderService(null);
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(makeOrder({ status: 'PENDING' }));

    await expect(service.claimReward('valid-token-123', {
      fullName: 'Test',
      password: 'pass123',
    })).rejects.toThrow(BadRequestException);
  });

  it('rejects phone mismatch', async () => {
    const { service, prisma } = createOrderService(null);
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(makeOrder({ guestPhone: '0911111111' }));

    await expect(service.claimReward('valid-token-123', {
      phone: '0922222222',
      fullName: 'Test',
      password: 'pass123',
    })).rejects.toThrow(BadRequestException);
  });

  it('creates user and awards points for valid claim', async () => {
    const { service, prisma } = createOrderService(null);
    const order = makeOrder();
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(order);

    (prisma.user.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);
    (prisma.user.create as jest.Mock) = jest.fn().mockResolvedValue({ id: 'new-user-1', email: 'test@test.com', fullName: 'Test', role: 'customer' });
    (prisma.customerProfile.upsert as jest.Mock) = jest.fn().mockResolvedValue({ id: 'profile-1', userId: 'new-user-1' });
    (prisma.loyaltyAccount.upsert as jest.Mock) = jest.fn().mockResolvedValue({ id: 'account-1' });
    (prisma.loyaltyAccount.update as jest.Mock) = jest.fn().mockResolvedValue({});
    (prisma.loyaltyTransaction.create as jest.Mock) = jest.fn().mockResolvedValue({});
    (prisma.order.update as jest.Mock) = jest.fn().mockResolvedValue({});
    (prisma.qRCard.upsert as jest.Mock) = jest.fn().mockResolvedValue({});

    const result = await service.claimReward('valid-token-123', {
      phone: '0933333333',
      fullName: 'Test User',
      password: 'pass123',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.pendingCoins).toBe(50);
    expect(result.pendingStamps).toBe(2);
  });
});

describe('OrdersService admin order status updates', () => {
  it('allows valid transition PENDING -> ACCEPTED', async () => {
    const { service, prisma } = createOrderService(null);
    const mockTx = {
      order: {
        findUnique: jest.fn().mockResolvedValue({ id: 'order-1', status: 'PENDING', customerId: null }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      orderStatusHistory: { create: jest.fn() },
    };
    (prisma.$transaction as jest.Mock) = jest.fn(async (fn: any) => fn(mockTx));

    const result = await service.updateStatus('order-1', 'ACCEPTED');

    expect(mockTx.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'ACCEPTED' } }),
    );
  });

  it('rejects invalid transition PENDING -> PICKED_UP', async () => {
    const { service, prisma } = createOrderService(null);
    const mockTx = {
      order: {
        findUnique: jest.fn().mockResolvedValue({ id: 'order-1', status: 'PENDING', customerId: null }),
      },
    };
    (prisma.$transaction as jest.Mock) = jest.fn(async (fn: any) => fn(mockTx));

    await expect(service.updateStatus('order-1', 'PICKED_UP')).rejects.toThrow(BadRequestException);
  });
});
