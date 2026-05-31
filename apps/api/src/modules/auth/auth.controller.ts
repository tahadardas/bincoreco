import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  LoginInput,
  RefreshInput,
  RegisterInput,
  loginSchema,
  refreshSchema,
  registerSchema,
} from '@banco-ricco/validators';
import { AuthService } from './auth.service';
import { successResponse } from '../../common/response.interface';
import { AuthenticatedRequest } from '../../common/auth/authenticated-request.type';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body(new ZodValidationPipe(registerSchema)) input: RegisterInput) {
    const result = await this.authService.register(input);
    return successResponse(result, 'Registration successful');
  }

  @Post('login')
  async login(@Body(new ZodValidationPipe(loginSchema)) input: LoginInput) {
    const result = await this.authService.login(input);
    return successResponse(result, 'Login successful');
  }

  @Post('admin/login')
  async adminLogin(@Body(new ZodValidationPipe(loginSchema)) input: LoginInput) {
    const result = await this.authService.adminLogin(input);
    return successResponse(result, 'Login successful');
  }

  @Post('refresh')
  async refresh(@Body(new ZodValidationPipe(refreshSchema)) input: RefreshInput) {
    const result = await this.authService.refresh(input.refreshToken);
    return successResponse(result, 'Token refreshed');
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async me(@Req() req: AuthenticatedRequest) {
    return successResponse(req.user);
  }
}
