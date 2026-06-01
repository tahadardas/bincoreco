import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { z } from 'zod';
import { LoyaltyService } from './loyalty.service';
import { successResponse, paginatedResponse } from '../../common/response.interface';
import { AuthenticatedRequest } from '../../common/auth/authenticated-request.type';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { MustChangePasswordGuard } from '../../common/auth/must-change-password.guard';

const loyaltyTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const redeemPointsSchema = z.object({
  points: z.coerce.number().int().positive(),
});

type LoyaltyTransactionsQuery = z.infer<typeof loyaltyTransactionsQuerySchema>;
type RedeemPointsInput = z.infer<typeof redeemPointsSchema>;

@ApiTags('Loyalty')
@Controller()
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  @Get('loyalty/my')
  @UseGuards(AuthGuard('jwt'), MustChangePasswordGuard)
  @ApiBearerAuth()
  async getMyAccount(@Req() req: AuthenticatedRequest) {
    const result = await this.loyaltyService.getMyAccount(req.user.id);
    return successResponse(result);
  }

  @Get('loyalty/transactions')
  @UseGuards(AuthGuard('jwt'), MustChangePasswordGuard)
  @ApiBearerAuth()
  async getTransactions(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(loyaltyTransactionsQuerySchema)) query: LoyaltyTransactionsQuery,
  ) {
    const { page, limit } = query;
    const result = await this.loyaltyService.getTransactions(req.user.id, page || 1, limit || 20);
    return paginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Post('loyalty/redeem-stamp')
  @UseGuards(AuthGuard('jwt'), MustChangePasswordGuard)
  @ApiBearerAuth()
  async redeemStamp(@Req() req: AuthenticatedRequest) {
    const result = await this.loyaltyService.redeemStampReward(req.user.id);
    return successResponse(result, 'Stamp reward redeemed!');
  }

  @Post('loyalty/redeem-points')
  @UseGuards(AuthGuard('jwt'), MustChangePasswordGuard)
  @ApiBearerAuth()
  async redeemPoints(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(redeemPointsSchema)) input: RedeemPointsInput,
  ) {
    const result = await this.loyaltyService.redeemPoints(req.user.id, input.points);
    return successResponse(result, 'Points redeemed!');
  }

  @Get('loyalty/qr')
  @UseGuards(AuthGuard('jwt'), MustChangePasswordGuard)
  @ApiBearerAuth()
  async getQR(@Req() req: AuthenticatedRequest) {
    const result = await this.loyaltyService.getQR(req.user.id);
    return successResponse(result);
  }

  @Post('loyalty/qr/regenerate')
  @UseGuards(AuthGuard('jwt'), MustChangePasswordGuard)
  @ApiBearerAuth()
  async regenerateQR(@Req() req: AuthenticatedRequest) {
    const result = await this.loyaltyService.regenerateQR(req.user.id);
    return successResponse(result, 'QR regenerated');
  }

  @Get('loyalty/qr/:token')
  async lookupByQR(@Param('token') token: string) {
    const account = await this.loyaltyService.findAccountByQRToken(token);
    if (!account) return successResponse(null);
    return successResponse({ customerId: account.customerId, balance: account.balance, stampCount: account.stampCount });
  }
}
