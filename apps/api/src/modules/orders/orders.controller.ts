import { Controller, Get, Post, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  CreateOrderInput,
  createOrderSchema,
  CreateGuestOrderInput,
  createGuestOrderSchema,
  ClaimRewardInput,
  claimRewardSchema,
} from '@banco-ricco/validators';
import { z } from 'zod';
import { OrdersService } from './orders.service';
import { successResponse, paginatedResponse } from '../../common/response.interface';
import { AuthenticatedRequest } from '../../common/auth/authenticated-request.type';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { MustChangePasswordGuard } from '../../common/auth/must-change-password.guard';

const myOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.string().optional(),
});

const guestOrderLookupSchema = z.object({
  phone: z.string().min(7).max(20),
});

type MyOrdersQuery = z.infer<typeof myOrdersQuerySchema>;
type GuestOrderLookupQuery = z.infer<typeof guestOrderLookupSchema>;

@ApiTags('Orders')
@Controller()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('orders')
  @UseGuards(AuthGuard('jwt'), MustChangePasswordGuard)
  @ApiBearerAuth()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createOrderSchema)) input: CreateOrderInput,
  ) {
    const order = await this.ordersService.create(req.user.id, input);
    return successResponse(order, 'Order created');
  }

  @Post('orders/guest')
  async createGuest(
    @Body(new ZodValidationPipe(createGuestOrderSchema)) input: CreateGuestOrderInput,
  ) {
    const order = await this.ordersService.createGuest(input);
    return successResponse(order, 'Order created');
  }

  @Post('orders/claim-reward')
  async claimReward(
    @Body(new ZodValidationPipe(claimRewardSchema)) input: ClaimRewardInput,
  ) {
    const result = await this.ordersService.claimReward(input.rewardClaimToken, {
      email: input.email,
      phone: input.phone,
      password: input.password,
      fullName: input.fullName,
    });
    return successResponse(result, 'Reward claimed! Welcome to Banco Ricco.');
  }

  @Post('orders/claim-reward-authenticated')
  @UseGuards(AuthGuard('jwt'), MustChangePasswordGuard)
  @ApiBearerAuth()
  async claimRewardAuthenticated(
    @Req() req: AuthenticatedRequest,
    @Body() body: { rewardClaimToken: string },
  ) {
    const result = await this.ordersService.claimRewardAuthenticated(req.user.id, body.rewardClaimToken);
    return successResponse(result, 'Reward claimed successfully.');
  }

  @Get('orders/my')
  @UseGuards(AuthGuard('jwt'), MustChangePasswordGuard)
  @ApiBearerAuth()
  async myOrders(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(myOrdersQuerySchema)) query: MyOrdersQuery,
  ) {
    const { page, limit, status } = query;
    const result = await this.ordersService.findByCustomer(req.user.id, { page, limit, status });
    return paginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Get('orders/:id')
  @UseGuards(AuthGuard('jwt'), MustChangePasswordGuard)
  @ApiBearerAuth()
  async findById(@Param('id') id: string) {
    const order = await this.ordersService.findById(id);
    return successResponse(order);
  }

  @Get('orders/number/:orderNumber')
  async findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    const order = await this.ordersService.findByOrderNumber(orderNumber);
    return successResponse(order);
  }

  @Get('orders/number/:orderNumber/lookup')
  async findByOrderNumberAndPhone(
    @Param('orderNumber') orderNumber: string,
    @Query(new ZodValidationPipe(guestOrderLookupSchema)) query: GuestOrderLookupQuery,
  ) {
    const order = await this.ordersService.findByOrderNumberAndPhone(orderNumber, query.phone);
    return successResponse(order);
  }
}
