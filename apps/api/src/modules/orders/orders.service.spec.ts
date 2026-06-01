import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, ProductType } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { GuestCartService } from '../guest-cart/guest-cart.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { CurrenciesService } from '../currencies/currencies.service';

function createOrderService(cart: unknown) {
  const prisma = {
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
    },
  } as unknown as PrismaService;

  const cartService = {
    getCart: jest.fn().mockResolvedValue(cart),
    clearCart: jest.fn().mockResolvedValue(undefined),
  } as unknown as CartService;

  const guestCartService = {} as unknown as GuestCartService;
  const loyaltyService = {} as unknown as LoyaltyService;
  const currenciesService = { getDefaultCurrencyCode: jest.fn().mockResolvedValue('SYP') } as unknown as CurrenciesService;
  const auditLogs = { record: jest.fn().mockResolvedValue(undefined) };
  const jwtService = new JwtService({ secret: 'test' });

  return {
    service: new OrdersService(prisma, cartService, guestCartService, loyaltyService, auditLogs as any, currenciesService, jwtService),
    prisma,
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
});
