import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { z } from 'zod';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  createCategorySchema,
  updateCategorySchema,
} from '@banco-ricco/validators';
import { CategoriesService } from './categories.service';
import { successResponse } from '../../common/response.interface';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const categoriesQuerySchema = z.object({
  locale: z.enum(['ar', 'en']).optional(),
});

type CategoriesQuery = z.infer<typeof categoriesQuerySchema>;

@ApiTags('Categories')
@Controller()
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get('categories')
  async findAll(@Query(new ZodValidationPipe(categoriesQuerySchema)) query: CategoriesQuery) {
    const { locale } = query;
    const items = await this.categoriesService.findAll(locale);
    return successResponse(items);
  }

  @Get('admin/categories')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async findAllAdmin(@Query(new ZodValidationPipe(categoriesQuerySchema)) query: CategoriesQuery) {
    const { locale } = query;
    const items = await this.categoriesService.findAllAdmin(locale);
    return successResponse(items);
  }

  @Get('categories/:id')
  async findById(@Param('id') id: string) {
    const item = await this.categoriesService.findById(id);
    return successResponse(item);
  }

  @Post('admin/categories')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async create(@Body(new ZodValidationPipe(createCategorySchema)) input: CreateCategoryInput) {
    const item = await this.categoriesService.create(input);
    return successResponse(item, 'Category created');
  }

  @Patch('admin/categories/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body(new ZodValidationPipe(updateCategorySchema)) input: UpdateCategoryInput) {
    const item = await this.categoriesService.update(id, input);
    return successResponse(item, 'Category updated');
  }

  @Delete('admin/categories/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    await this.categoriesService.remove(id);
    return successResponse(null, 'Category deleted');
  }
}
