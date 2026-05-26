import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(customerId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { customerId },
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: true,
                variants: { include: { prices: true } },
              },
            },
            variant: { include: { prices: true } },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { customerId },
        include: { items: { include: { product: { include: { translations: true, variants: { include: { prices: true } } } }, variant: { include: { prices: true } } } } },
      });
    }

    return cart;
  }

  async addItem(customerId: string, input: { productId: string; variantId?: string; quantity: number; selectedOptions?: any }) {
    const cart = await this.getCart(customerId);
    const product = await this.prisma.product.findUnique({ where: { id: input.productId } });
    if (!product || !product.isActive) throw new NotFoundException('Product not found or inactive');

    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: input.productId,
        variantId: input.variantId || null,
      },
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + input.quantity },
        include: { product: { include: { translations: true } }, variant: true },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: input.productId,
        variantId: input.variantId || null,
        quantity: input.quantity,
        selectedOptions: input.selectedOptions || undefined,
      },
      include: { product: { include: { translations: true } }, variant: true },
    });
  }

  async updateItem(customerId: string, itemId: string, quantity: number) {
    const cart = await this.getCart(customerId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    if (quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
      return null;
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: { include: { translations: true } }, variant: true },
    });
  }

  async removeItem(customerId: string, itemId: string) {
    const cart = await this.getCart(customerId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    await this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async clearCart(customerId: string) {
    const cart = await this.getCart(customerId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
}
