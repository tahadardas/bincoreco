import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { successResponse } from '../../common/response.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() input: { email?: string; phone?: string; password: string; fullName: string }) {
    const result = await this.authService.register(input);
    return successResponse(result, 'Registration successful');
  }

  @Post('login')
  async login(@Body() input: { email?: string; phone?: string; password: string }) {
    const result = await this.authService.login(input);
    return successResponse(result, 'Login successful');
  }

  @Post('refresh')
  async refresh(@Body() input: { refreshToken: string }) {
    const result = await this.authService.refresh(input.refreshToken);
    return successResponse(result, 'Token refreshed');
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async me(@Req() req: any) {
    return successResponse(req.user);
  }
}
