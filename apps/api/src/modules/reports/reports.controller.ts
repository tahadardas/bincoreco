import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { z } from 'zod';
import { ReportsService } from './reports.service';
import { successResponse } from '../../common/response.interface';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const reportsQuerySchema = z.object({
  fromDate: z.string().refine(value => !Number.isNaN(Date.parse(value)), { message: 'Invalid fromDate' }).optional(),
  toDate: z.string().refine(value => !Number.isNaN(Date.parse(value)), { message: 'Invalid toDate' }).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

type ReportsQuery = z.infer<typeof reportsQuerySchema>;

@ApiTags('Reports')
@Controller('admin/reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'maestro')
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('top-products')
  async getTopProducts(
    @Query(new ZodValidationPipe(reportsQuerySchema)) query: ReportsQuery,
  ) {
    const { fromDate, toDate, limit } = query;
    const data = await this.reportsService.getTopProducts({ fromDate, toDate, limit });
    return successResponse(data);
  }

  @Get('daily-sales')
  async getDailySales(
    @Query(new ZodValidationPipe(reportsQuerySchema)) query: ReportsQuery,
  ) {
    const { fromDate, toDate } = query;
    const data = await this.reportsService.getDailySales({ fromDate, toDate });
    return successResponse(data);
  }

  @Get('orders-by-status')
  async getOrdersByStatus(
    @Query(new ZodValidationPipe(reportsQuerySchema)) query: ReportsQuery,
  ) {
    const { fromDate, toDate } = query;
    const data = await this.reportsService.getOrdersByStatus({ fromDate, toDate });
    return successResponse(data);
  }

  @Get('cancelled-orders')
  async getCancelledOrders(
    @Query(new ZodValidationPipe(reportsQuerySchema)) query: ReportsQuery,
  ) {
    const { fromDate, toDate, limit } = query;
    const data = await this.reportsService.getCancelledOrders({ fromDate, toDate, limit });
    return successResponse(data);
  }

  @Get('average-preparation-time')
  async getAveragePreparationTime(
    @Query(new ZodValidationPipe(reportsQuerySchema)) query: ReportsQuery,
  ) {
    const { fromDate, toDate } = query;
    const data = await this.reportsService.getAveragePreparationTime({ fromDate, toDate });
    return successResponse(data);
  }

  @Get('revenue')
  async getRevenueByDateRange(
    @Query(new ZodValidationPipe(reportsQuerySchema)) query: ReportsQuery,
  ) {
    const { fromDate, toDate } = query;
    const data = await this.reportsService.getRevenueByDateRange({ fromDate, toDate });
    return successResponse(data);
  }
}
