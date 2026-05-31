import { Controller, Get, Patch, Param, Body, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { updateOrderStatusSchema, UpdateOrderStatusInput } from '@banco-ricco/validators';
import { z } from 'zod';
import { AdminService } from './admin.service';
import { successResponse, paginatedResponse, errorResponse } from '../../common/response.interface';
import { AuthenticatedRequest } from '../../common/auth/authenticated-request.type';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { getAuditContext } from '../../common/audit/audit-context';

const VALID_ORDER_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'CANCELLED'] as const;

const adminOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  status: z.enum(VALID_ORDER_STATUSES).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  search: z.string().optional(),
});

type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'maestro')
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    const data = await this.adminService.getDashboard();
    return successResponse(data);
  }

  @Get('orders')
  @Roles('admin', 'maestro', 'staff')
  async getOrders(
    @Query(new ZodValidationPipe(adminOrdersQuerySchema)) query: AdminOrdersQuery,
  ) {
    const { page, limit, status, fromDate, toDate, search } = query;
    const result = await this.adminService.getOrders({ page, limit, status, fromDate, toDate, search });
    return paginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Patch('orders/:id/status')
  @Roles('admin', 'maestro', 'staff')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOrderStatusSchema)) input: UpdateOrderStatusInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const order = await this.adminService.updateOrderStatus(id, input.status, input.reason, req.user.id, getAuditContext(req));
    return successResponse(order, 'Order status updated');
  }
}
