import { Controller, Get, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { successResponse, paginatedResponse } from '../../common/response.interface';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    const data = await this.adminService.getDashboard();
    return successResponse(data);
  }

  @Get('orders')
  async getOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.adminService.getOrders({ page, limit, status, fromDate, toDate, search });
    return paginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() input: { status: string; reason?: string },
    @Req() req: any,
  ) {
    const order = await this.adminService.updateOrderStatus(id, input.status, input.reason, req.user.id);
    return successResponse(order, 'Order status updated');
  }
}
