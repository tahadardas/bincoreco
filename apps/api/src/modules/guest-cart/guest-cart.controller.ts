import { Controller, Get, Post, Patch, Delete, Param, Body, Query, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AddCartItemInput,
  addCartItemSchema,
  UpdateCartItemInput,
  updateCartItemSchema,
} from '@banco-ricco/validators';
import { z } from 'zod';
import { GuestCartService } from './guest-cart.service';
import { successResponse } from '../../common/response.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const sessionQuerySchema = z.object({
  sessionId: z.string().min(1),
});

type SessionQuery = z.infer<typeof sessionQuerySchema>;

@ApiTags('Guest Cart')
@Controller('guest-cart')
export class GuestCartController {
  constructor(private guestCartService: GuestCartService) {}

  @Get()
  async getCart(@Query(new ZodValidationPipe(sessionQuerySchema)) query: SessionQuery) {
    const cart = await this.guestCartService.getCart(query.sessionId);
    return successResponse(cart);
  }

  @Post('items')
  async addItem(
    @Query(new ZodValidationPipe(sessionQuerySchema)) query: SessionQuery,
    @Body(new ZodValidationPipe(addCartItemSchema)) input: AddCartItemInput,
  ) {
    const item = await this.guestCartService.addItem(query.sessionId, input);
    return successResponse(item, 'Item added to cart');
  }

  @Patch('items/:itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @Query(new ZodValidationPipe(sessionQuerySchema)) query: SessionQuery,
    @Body(new ZodValidationPipe(updateCartItemSchema)) input: UpdateCartItemInput,
  ) {
    const item = await this.guestCartService.updateItem(query.sessionId, itemId, input.quantity);
    return successResponse(item, 'Cart item updated');
  }

  @Delete('items/:itemId')
  async removeItem(
    @Param('itemId') itemId: string,
    @Query(new ZodValidationPipe(sessionQuerySchema)) query: SessionQuery,
  ) {
    await this.guestCartService.removeItem(query.sessionId, itemId);
    return successResponse(null, 'Item removed from cart');
  }

  @Delete()
  async clearCart(@Query(new ZodValidationPipe(sessionQuerySchema)) query: SessionQuery) {
    await this.guestCartService.clearCart(query.sessionId);
    return successResponse(null, 'Cart cleared');
  }
}
