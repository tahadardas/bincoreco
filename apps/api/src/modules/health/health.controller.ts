import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../common/response.interface';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get('health')
  check() {
    return successResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    });
  }
}
