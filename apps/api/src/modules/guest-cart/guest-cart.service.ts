import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, ProductType } from '@prisma/client';
import { AddCartItemInput } from '@banco-ricco/validators';
import { PrismaService } from '../prisma/prisma.service';
import { CurrenciesService } from '../currencies/currencies.service';

const cartProductInclude = Prisma.validator<Prisma.ProductInclude>()({
  translations: true,
  variants: { include: { prices: true } },
  grindOptions: { include: { grindOption: true } },
});

type CartProduct = Prisma.ProductGetPayload<{ include: typeof cartProductInclude }>;

@Injectable()
export class GuestCartService {
  constructor(
    private prisma: PrismaService,
    private currenciesService: CurrenciesService,
  ) {}

  async getCart(sessionId: string) {
    let cart = await this.prisma.guestCart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: {
              include: cartProductInclude,
            },
            variant: { include: { prices: true } },
          },
        },
      },
    });

    if (!cart) {
      const currencyCode = await this.currenciesService.getDefaultCurrencyCode();
      cart = await this.prisma.guestCart.create({
        data: { sessionId, currencyCode },
        include: { items: { include: { product: { include: cartProductInclude }, variant: { include: { prices: true } } } } },
      });
    }

    return cart;
  }

  async addItem(sessionId: string, input: AddCartItemInput) {
    const cart = await this.getCart(sessionId);
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
      include: cartProductInclude,
    });
    if (!product || !product.isActive) throw new NotFoundException('Product not found or inactive');

    const selectedVariant = input.variantId
      ? product.variants.find(v => v.id === input.variantId && v.isActive)
      : product.variants.find(v => v.isActive);
    if (!selectedVariant) {
      throw new BadRequestException('Selected variant is not available for this product');
    }

    const currencyCode = input.currencyCode || cart.currencyCode || await this.currenciesService.getDefaultCurrencyCode();
    const hasActivePrice = selectedVariant.prices.some(p => p.currencyCode === currencyCode && p.isActive);
    if (!hasActivePrice) {
      const productName = product.translations[0]?.name || product.sku;
      throw new BadRequestException(`No active ${currencyCode} price is configured for ${productName}`);
    }

    if (cart.currencyCode !== currencyCode) {
      if (cart.items.length > 0) {
        throw new BadRequestException(`Cart already uses ${cart.currencyCode}. Clear the cart before switching to ${currencyCode}.`);
      }
      await this.prisma.guestCart.update({
        where: { id: cart.id },
        data: { currencyCode },
      });
    }

    const selectedOptions = this.validateAndNormalizeSelectedOptions(product, input.selectedOptions);

    const existingItems = await this.prisma.guestCartItem.findMany({
      where: {
        guestCartId: cart.id,
        productId: input.productId,
        variantId: input.variantId || null,
      },
    });
    const existingItem = existingItems.find(item => this.jsonEquals(item.selectedOptions, selectedOptions));

    if (existingItem) {
      return this.prisma.guestCartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + input.quantity },
        include: { product: { include: { translations: true } }, variant: true },
      });
    }

    return this.prisma.guestCartItem.create({
      data: {
        guestCartId: cart.id,
        productId: input.productId,
        variantId: input.variantId || null,
        quantity: input.quantity,
        selectedOptions,
      },
      include: { product: { include: { translations: true } }, variant: true },
    });
  }

  async updateItem(sessionId: string, itemId: string, quantity: number) {
    const cart = await this.getCart(sessionId);
    const item = await this.prisma.guestCartItem.findFirst({
      where: { id: itemId, guestCartId: cart.id },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    if (quantity <= 0) {
      await this.prisma.guestCartItem.delete({ where: { id: itemId } });
      return null;
    }

    return this.prisma.guestCartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: { include: { translations: true } }, variant: true },
    });
  }

  async removeItem(sessionId: string, itemId: string) {
    const cart = await this.getCart(sessionId);
    const item = await this.prisma.guestCartItem.findFirst({
      where: { id: itemId, guestCartId: cart.id },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    await this.prisma.guestCartItem.delete({ where: { id: itemId } });
  }

  async clearCart(sessionId: string) {
    const cart = await this.getCart(sessionId);
    await this.prisma.guestCartItem.deleteMany({ where: { guestCartId: cart.id } });
  }

  private validateAndNormalizeSelectedOptions(
    product: CartProduct,
    selectedOptions?: AddCartItemInput['selectedOptions'],
  ): Prisma.InputJsonValue | undefined {
    const selected = { ...(selectedOptions || {}) };

    if (product.type !== ProductType.COFFEE_BEAN && product.type !== ProductType.GROUND_COFFEE) {
      if (selected.grindType || selected.grindOptionId) {
        throw new BadRequestException('Grind options can only be selected for coffee bean products');
      }
      return Object.keys(selected).length ? selected as Prisma.InputJsonValue : undefined;
    }

    const grindType = product.type === ProductType.GROUND_COFFEE
      ? 'ground'
      : selected.grindType || 'whole_bean';

    if (product.type === ProductType.GROUND_COFFEE && selected.grindType && selected.grindType !== 'ground') {
      throw new BadRequestException('Ground coffee requires a grind option');
    }

    if (grindType === 'whole_bean') {
      delete selected.grindOptionId;
      delete selected.grindOptionNameAr;
      delete selected.grindOptionNameEn;
      return { ...selected, grindType: 'whole_bean' };
    }

    if (grindType !== 'ground') throw new BadRequestException('Invalid grind type');
    if (!selected.grindOptionId) throw new BadRequestException('اختر طريقة الطحن أولاً');

    const linkedGrindOption = product.grindOptions.find(link =>
      link.grindOptionId === selected.grindOptionId && link.isActive && link.grindOption.isActive,
    );
    if (!linkedGrindOption) throw new BadRequestException('Selected grind option is not available for this product');

    return {
      ...selected,
      grindType: 'ground',
      grindOptionId: linkedGrindOption.grindOptionId,
      grindOptionNameAr: linkedGrindOption.grindOption.nameAr,
      grindOptionNameEn: linkedGrindOption.grindOption.nameEn,
    };
  }

  private jsonEquals(left: unknown, right: unknown) {
    return this.toComparableJson(left) === this.toComparableJson(right);
  }

  private toComparableJson(value: unknown): string {
    if (Array.isArray(value)) {
      return JSON.stringify(value.map(item => JSON.parse(this.toComparableJson(item))));
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(record).sort()) {
        sorted[key] = JSON.parse(this.toComparableJson(record[key]));
      }
      return JSON.stringify(sorted);
    }
    return JSON.stringify(value ?? null);
  }
}
