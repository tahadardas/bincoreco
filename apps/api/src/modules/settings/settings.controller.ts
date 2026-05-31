import { Controller, Get, Put, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
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
  value: z.string().max(1000).optional().default(''),
});

type UpdateSettingInput = z.infer<typeof updateSettingSchema>;

@ApiTags('Settings')
@Controller()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('settings/public-brand')
  async getPublicBrand() {
    const data = await this.settingsService.getPublicBrandSettings();
    return successResponse(data);
  }

  @Get('admin/settings')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async getAll() {
    const data = await this.settingsService.getAll();
    return successResponse(data);
  }

  @Put('admin/settings/:key')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async update(
    @Param('key') key: string,
    @Body(new ZodValidationPipe(updateSettingSchema)) input: UpdateSettingInput,
    @Req() req: AuthenticatedRequest,
  ) {
    if (input.value) {
      await this.settingsService.set(key, input.value, getAuditContext(req));
    } else {
      await this.settingsService.remove(key, getAuditContext(req));
    }
    return successResponse(null, 'Setting updated');
  }

  @Delete('admin/settings/:key')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async remove(
    @Param('key') key: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.settingsService.remove(key, getAuditContext(req));
    return successResponse(null, 'Setting removed');
  }
}
