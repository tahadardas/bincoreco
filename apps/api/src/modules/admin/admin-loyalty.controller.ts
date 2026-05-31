import { Controller, Get, Post, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { z } from 'zod';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { successResponse, paginatedResponse } from '../../common/response.interface';
import { AuthenticatedRequest } from '../../common/auth/authenticated-request.type';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { getAuditContext } from '../../common/audit/audit-context';

const loyaltyPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const adjustPointsSchema = z.object({
  points: z.coerce.number().int().refine(value => value !== 0, 'Points adjustment cannot be zero'),
  reason: z.string().min(3).max(500),
});

const adjustStampsSchema = z.object({
  stamps: z.coerce.number().int().refine(value => value !== 0, 'Stamps adjustment cannot be zero'),
  reason: z.string().min(3).max(500),
});

type LoyaltyPaginationQuery = z.infer<typeof loyaltyPaginationQuerySchema>;
type AdjustPointsInput = z.infer<typeof adjustPointsSchema>;
type AdjustStampsInput = z.infer<typeof adjustStampsSchema>;

@ApiTags('Admin Loyalty')
@Controller('admin/loyalty')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'maestro')
@ApiBearerAuth()
export class AdminLoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  @Get()
  async getAll(@Query(new ZodValidationPipe(loyaltyPaginationQuerySchema)) query: LoyaltyPaginationQuery) {
    const { page, limit } = query;
    const result = await this.loyaltyService.adminGetAll(page || 1, limit || 20);
    return paginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Post(':id/adjust-points')
  async adjustPoints(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adjustPointsSchema)) input: AdjustPointsInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.loyaltyService.adminAdjustPoints(id, input.points, input.reason, req.user.id, getAuditContext(req));
    return successResponse(result, 'Points adjusted');
  }

  @Post(':id/adjust-stamps')
  async adjustStamps(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adjustStampsSchema)) input: AdjustStampsInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.loyaltyService.adminAdjustStamps(id, input.stamps, input.reason, req.user.id, getAuditContext(req));
    return successResponse(result, 'Stamps adjusted');
  }
}
