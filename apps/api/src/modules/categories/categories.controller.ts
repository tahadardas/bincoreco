import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './categories.service';
import { successResponse } from '../../common/response.interface';

@ApiTags('Categories')
@Controller()
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get('categories')
  async findAll(@Query('locale') locale?: string) {
    const items = await this.categoriesService.findAll(locale);
    return successResponse(items);
  }

  @Get('categories/:id')
  async findById(@Param('id') id: string) {
    const item = await this.categoriesService.findById(id);
    return successResponse(item);
  }

  @Post('admin/categories')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async create(@Body() input: any) {
    const item = await this.categoriesService.create(input);
    return successResponse(item, 'Category created');
  }

  @Patch('admin/categories/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() input: any) {
    const item = await this.categoriesService.update(id, input);
    return successResponse(item, 'Category updated');
  }

  @Delete('admin/categories/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    await this.categoriesService.remove(id);
    return successResponse(null, 'Category deleted');
  }
}
