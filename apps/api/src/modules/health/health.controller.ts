import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { successResponse } from '../../common/response.interface';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  check() {
    return successResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    });
  }

  @Get('health/db')
  async checkDb() {
    let dbStatus = 'ok';
    let dbError: string | null = null;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e: any) {
      dbStatus = 'error';
      dbError = e.message;
    }
    return successResponse({
      status: dbStatus,
      database: dbStatus,
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      ...(dbError ? { error: dbError } : {}),
    });
  }
}
