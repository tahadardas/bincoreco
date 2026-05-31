import { Controller, Get, Put, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { z } from 'zod';
import { SettingsService } from './settings.service';
import { successResponse } from '../../common/response.interface';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthenticatedRequest } from '../../common/auth/authenticated-request.type';
import { getAuditContext } from '../../common/audit/audit-context';

const updateSettingSchema = z.object({
  value: z.string().min(1).max(1000),
});

type UpdateSettingInput = z.infer<typeof updateSettingSchema>;

@ApiTags('Settings')
@Controller('admin/settings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'maestro')
@ApiBearerAuth()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  async getAll() {
    const data = await this.settingsService.getAll();
    return successResponse(data);
  }

  @Put(':key')
  async update(
    @Param('key') key: string,
    @Body(new ZodValidationPipe(updateSettingSchema)) input: UpdateSettingInput,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.settingsService.set(key, input.value, getAuditContext(req));
    return successResponse(null, 'Setting updated');
  }
}
