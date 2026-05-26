import { Controller, Get, Post, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { successResponse, paginatedResponse } from '../../common/response.interface';

@ApiTags('Admin Loyalty')
@Controller('admin/loyalty')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AdminLoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  @Get()
  async getAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    const result = await this.loyaltyService.adminGetAll(page || 1, limit || 20);
    return paginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Post(':id/adjust-points')
  async adjustPoints(@Param('id') id: string, @Body() input: { points: number; reason: string }, @Req() req: any) {
    const result = await this.loyaltyService.adminAdjustPoints(id, input.points, input.reason, req.user?.id || 'admin');
    return successResponse(result, 'Points adjusted');
  }

  @Post(':id/adjust-stamps')
  async adjustStamps(@Param('id') id: string, @Body() input: { stamps: number; reason: string }, @Req() req: any) {
    const result = await this.loyaltyService.adminAdjustStamps(id, input.stamps, input.reason, req.user?.id || 'admin');
    return successResponse(result, 'Stamps adjusted');
  }
}
