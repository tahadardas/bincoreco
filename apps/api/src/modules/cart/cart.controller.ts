import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  AddCartItemInput,
  UpdateCartItemInput,
  addCartItemSchema,
  updateCartItemSchema,
} from '@banco-ricco/validators';
import { CartService } from './cart.service';
import { successResponse } from '../../common/response.interface';
import { AuthenticatedRequest } from '../../common/auth/authenticated-request.type';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  async getCart(@Req() req: AuthenticatedRequest) {
    const cart = await this.cartService.getCart(req.user.id);
    return successResponse(cart);
  }

  @Post('items')
  async addItem(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(addCartItemSchema)) input: AddCartItemInput,
  ) {
    const item = await this.cartService.addItem(req.user.id, input);
    return successResponse(item, 'Item added to cart');
  }

  @Patch('items/:itemId')
  async updateItem(
    @Req() req: AuthenticatedRequest,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(updateCartItemSchema)) input: UpdateCartItemInput,
  ) {
    const item = await this.cartService.updateItem(req.user.id, itemId, input.quantity);
    return successResponse(item, 'Cart item updated');
  }

  @Delete('items/:itemId')
  async removeItem(@Req() req: AuthenticatedRequest, @Param('itemId') itemId: string) {
    await this.cartService.removeItem(req.user.id, itemId);
    return successResponse(null, 'Item removed from cart');
  }

  @Delete()
  async clearCart(@Req() req: AuthenticatedRequest) {
    await this.cartService.clearCart(req.user.id);
    return successResponse(null, 'Cart cleared');
  }
}
