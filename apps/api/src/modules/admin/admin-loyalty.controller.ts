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

const redeemPointsSchema = z.object({
  points: z.coerce.number().int().positive(),
  reason: z.string().min(3).max(500),
  orderId: z.string().optional(),
  note: z.string().optional(),
});

const redeemStampsSchema = z.object({
  stamps: z.coerce.number().int().positive(),
  rewardName: z.string().min(1).max(200),
  orderId: z.string().optional(),
  note: z.string().optional(),
});

const scanQrSchema = z.object({
  token: z.string().min(1).max(100),
});

const searchQuerySchema = z.object({
  query: z.string().min(1).max(100),
});

type LoyaltyPaginationQuery = z.infer<typeof loyaltyPaginationQuerySchema>;
type AdjustPointsInput = z.infer<typeof adjustPointsSchema>;
type AdjustStampsInput = z.infer<typeof adjustStampsSchema>;
type RedeemPointsInput = z.infer<typeof redeemPointsSchema>;
type RedeemStampsInput = z.infer<typeof redeemStampsSchema>;
type ScanQrInput = z.infer<typeof scanQrSchema>;
type SearchQuery = z.infer<typeof searchQuerySchema>;

@ApiTags('Admin Loyalty')
@Controller('admin/loyalty')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'maestro', 'staff')
@ApiBearerAuth()
export class AdminLoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  @Get()
  async getAll(@Query(new ZodValidationPipe(loyaltyPaginationQuerySchema)) query: LoyaltyPaginationQuery) {
    const { page, limit } = query;
    const result = await this.loyaltyService.adminGetAll(page || 1, limit || 20);
    return paginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Get('search')
  async search(@Query(new ZodValidationPipe(searchQuerySchema)) query: SearchQuery) {
    const results = await this.loyaltyService.adminSearch(query.query);
    return successResponse(results);
  }

  @Post('scan-qr')
  async scanQr(@Body(new ZodValidationPipe(scanQrSchema)) input: ScanQrInput) {
    const account = await this.loyaltyService.findAccountByQRToken(input.token);
    if (!account) return successResponse(null);
    return successResponse(account);
  }

  @Post(':id/redeem-points')
  async redeemPoints(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(redeemPointsSchema)) input: RedeemPointsInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const orderId = input.orderId || undefined;
    const note = input.note || input.reason;
    const result = await this.loyaltyService.adminRedeemPoints(
      id, input.points, `${input.reason}${note !== input.reason ? ` (${note})` : ''}`,
      req.user.id, orderId, getAuditContext(req),
    );
    return successResponse(result, 'Points redeemed successfully');
  }

  @Post(':id/redeem-stamps')
  async redeemStamps(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(redeemStampsSchema)) input: RedeemStampsInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const orderId = input.orderId || undefined;
    const result = await this.loyaltyService.adminRedeemStamps(
      id, input.stamps, input.rewardName,
      req.user.id, orderId, getAuditContext(req),
    );
    return successResponse(result, 'Stamps redeemed successfully');
  }

  @Post(':id/adjust-points')
  @Roles('admin', 'maestro')
  async adjustPoints(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adjustPointsSchema)) input: AdjustPointsInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.loyaltyService.adminAdjustPoints(id, input.points, input.reason, req.user.id, getAuditContext(req));
    return successResponse(result, 'Points adjusted');
  }

  @Post(':id/adjust-stamps')
  @Roles('admin', 'maestro')
  async adjustStamps(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adjustStampsSchema)) input: AdjustStampsInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.loyaltyService.adminAdjustStamps(id, input.stamps, input.reason, req.user.id, getAuditContext(req));
    return successResponse(result, 'Stamps adjusted');
  }
}
