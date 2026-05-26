import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GrindOptionsService } from './grind-options.service';
import { successResponse } from '../../common/response.interface';

@ApiTags('Grind Options')
@Controller()
export class GrindOptionsController {
  constructor(private grindOptionsService: GrindOptionsService) {}

  @Get('grind-options')
  async findAll() {
    const items = await this.grindOptionsService.findAll();
    return successResponse(items);
  }

  @Post('admin/grind-options')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async create(@Body() input: any) {
    const item = await this.grindOptionsService.create(input);
    return successResponse(item, 'Grind option created');
  }

  @Patch('admin/grind-options/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() input: any) {
    const item = await this.grindOptionsService.update(id, input);
    return successResponse(item, 'Grind option updated');
  }

  @Delete('admin/grind-options/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    await this.grindOptionsService.remove(id);
    return successResponse(null, 'Grind option deleted');
  }
}
