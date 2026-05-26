import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { successResponse } from '../../common/response.interface';

@ApiTags('Reports')
@Controller('admin/reports')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('top-products')
  async getTopProducts(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit') limit?: number,
  ) {
    const data = await this.reportsService.getTopProducts({ fromDate, toDate, limit });
    return successResponse(data);
  }

  @Get('daily-sales')
  async getDailySales(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const data = await this.reportsService.getDailySales({ fromDate, toDate });
    return successResponse(data);
  }
}
