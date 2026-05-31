import { BadRequestException } from '@nestjs/common';
import { ProductType } from '@prisma/client';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';

function createPrismaMock(product: unknown) {
  return {
    cart: {
      findUnique: jest.fn().mockResolvedValue({ id: 'cart-1', currencyCode: 'SYP', items: [] }),
      create: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 'cart-1', currencyCode: 'SYP' }),
    },
    setting: {
      findUnique: jest.fn().mockResolvedValue({ key: 'default_currency', value: 'SYP' }),
    },
    product: {
      findUnique: jest.fn().mockResolvedValue(product),
    },
    cartItem: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'item-1' }),
      update: jest.fn(),
    },
  } as unknown as PrismaService;
}

const coffeeBeanProduct = {
  id: 'product-1',
  sku: 'BR-V60-COL',
  type: ProductType.COFFEE_BEAN,
  isActive: true,
  translations: [],
  variants: [{ id: 'variant-1', isActive: true, prices: [{ currencyCode: 'SYP', isActive: true, amount: 45000 }] }],
  grindOptions: [
    {
      grindOptionId: '11111111-1111-4111-8111-111111111111',
      isActive: true,
      grindOption: {
        isActive: true,
        nameAr: 'V60',
        nameEn: 'V60',
      },
    },
  ],
};

describe('CartService grind validation', () => {
  it('rejects ground coffee bean items without a grind option', async () => {
    const prisma = createPrismaMock(coffeeBeanProduct);
    const service = new CartService(prisma);

    await expect(service.addItem('customer-1', {
      productId: 'product-1',
      variantId: 'variant-1',
      quantity: 1,
      selectedOptions: { grindType: 'ground' },
    })).rejects.toThrow(BadRequestException);
  });

  it('accepts ground coffee bean items with an active product grind option', async () => {
    const prisma = createPrismaMock(coffeeBeanProduct);
    const service = new CartService(prisma);

    await service.addItem('customer-1', {
      productId: 'product-1',
      variantId: 'variant-1',
      quantity: 1,
      selectedOptions: {
        grindType: 'ground',
        grindOptionId: '11111111-1111-4111-8111-111111111111',
      },
    });

    expect(prisma.cartItem.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        selectedOptions: expect.objectContaining({
          grindType: 'ground',
          grindOptionId: '11111111-1111-4111-8111-111111111111',
          grindOptionNameAr: 'V60',
          grindOptionNameEn: 'V60',
        }),
      }),
    }));
  });
});
