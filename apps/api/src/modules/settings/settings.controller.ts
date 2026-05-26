import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { successResponse } from '../../common/response.interface';

@ApiTags('Settings')
@Controller('admin/settings')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  async getAll() {
    const data = await this.settingsService.getAll();
    return successResponse(data);
  }

  @Put(':key')
  async update(@Param('key') key: string, @Body() input: { value: string }) {
    await this.settingsService.set(key, input.value);
    return successResponse(null, 'Setting updated');
  }
}
