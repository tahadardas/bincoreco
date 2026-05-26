import { Controller, Get, Post, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { successResponse, paginatedResponse } from '../../common/response.interface';

@ApiTags('Orders')
@Controller()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('orders')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async create(@Req() req: any, @Body() input: { pickupTime: string; notes?: string }) {
    const order = await this.ordersService.create(req.user.id, input);
    return successResponse(order, 'Order created');
  }

  @Get('orders/my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async myOrders(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const result = await this.ordersService.findByCustomer(req.user.id, { page, limit, status });
    return paginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Get('orders/:id')
  @UseGuards(AuthGuard('jwt'))
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
}
