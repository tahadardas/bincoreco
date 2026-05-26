import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CartService } from './cart.service';
import { successResponse } from '../../common/response.interface';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  async getCart(@Req() req: any) {
    const cart = await this.cartService.getCart(req.user.id);
    return successResponse(cart);
  }

  @Post('items')
  async addItem(@Req() req: any, @Body() input: { productId: string; variantId?: string; quantity: number; selectedOptions?: any }) {
    const item = await this.cartService.addItem(req.user.id, input);
    return successResponse(item, 'Item added to cart');
  }

  @Patch('items/:itemId')
  async updateItem(@Req() req: any, @Param('itemId') itemId: string, @Body() input: { quantity: number }) {
    const item = await this.cartService.updateItem(req.user.id, itemId, input.quantity);
    return successResponse(item, 'Cart item updated');
  }

  @Delete('items/:itemId')
  async removeItem(@Req() req: any, @Param('itemId') itemId: string) {
    await this.cartService.removeItem(req.user.id, itemId);
    return successResponse(null, 'Item removed from cart');
  }

  @Delete()
  async clearCart(@Req() req: any) {
    await this.cartService.clearCart(req.user.id);
    return successResponse(null, 'Cart cleared');
  }
}
