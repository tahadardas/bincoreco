import { Controller, Get, Post, Param, Body, Query, UseGuards, Req, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LoyaltyService } from './loyalty.service';
import { successResponse, paginatedResponse } from '../../common/response.interface';

@ApiTags('Loyalty')
@Controller()
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  @Get('loyalty/my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getMyAccount(@Req() req: any) {
    const result = await this.loyaltyService.getMyAccount(req.user.id);
    return successResponse(result);
  }

  @Get('loyalty/transactions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getTransactions(@Req() req: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    const result = await this.loyaltyService.getTransactions(req.user.id, page || 1, limit || 20);
    return paginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Post('loyalty/redeem-stamp')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async redeemStamp(@Req() req: any) {
    const result = await this.loyaltyService.redeemStampReward(req.user.id);
    return successResponse(result, 'Stamp reward redeemed!');
  }

  @Post('loyalty/redeem-points')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async redeemPoints(@Req() req: any, @Body() input: { points: number }) {
    const result = await this.loyaltyService.redeemPoints(req.user.id, input.points);
    return successResponse(result, 'Points redeemed!');
  }

  @Get('loyalty/qr')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getQR(@Req() req: any) {
    const result = await this.loyaltyService.getQR(req.user.id);
    return successResponse(result);
  }

  @Post('loyalty/qr/regenerate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async regenerateQR(@Req() req: any) {
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
