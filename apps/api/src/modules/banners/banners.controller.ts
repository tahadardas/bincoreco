import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BannersService } from './banners.service';
import { successResponse } from '../../common/response.interface';

@ApiTags('Banners')
@Controller()
export class BannersController {
  constructor(private bannersService: BannersService) {}

  @Get('banners')
  async findAll(@Query('locale') locale?: string) {
    const items = await this.bannersService.findAll(locale);
    return successResponse(items);
  }

  @Get('admin/banners')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async findAllAdmin() {
    const items = await this.bannersService.findAllAdmin();
    return successResponse(items);
  }

  @Post('admin/banners')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async create(@Body() input: any) {
    const item = await this.bannersService.create(input);
    return successResponse(item, 'Banner created');
  }

  @Patch('admin/banners/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() input: any) {
    const item = await this.bannersService.update(id, input);
    return successResponse(item, 'Banner updated');
  }

  @Delete('admin/banners/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    await this.bannersService.remove(id);
    return successResponse(null, 'Banner deleted');
  }
}
