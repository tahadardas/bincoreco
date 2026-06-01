import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { z } from 'zod';
import { ProductSizeOptionsService } from './product-size-options.service';
import { successResponse } from '../../common/response.interface';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const sizeOptionSchema = z.object({
  code: z.string().min(1).max(50),
  nameAr: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
  sizeValue: z.coerce.number().positive().optional().nullable(),
  sizeUnit: z.string().max(20).optional(),
  productType: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

const updateSizeOptionSchema = sizeOptionSchema.partial();

@ApiTags('Product Size Options')
@Controller()
export class ProductSizeOptionsController {
  constructor(private productSizeOptionsService: ProductSizeOptionsService) {}

  @Get('admin/product-size-options')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async findAll() {
    const items = await this.productSizeOptionsService.findAllAdmin();
    return successResponse(items);
  }

  @Post('admin/product-size-options')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async create(@Body(new ZodValidationPipe(sizeOptionSchema)) input: z.infer<typeof sizeOptionSchema>) {
    const item = await this.productSizeOptionsService.create(input);
    return successResponse(item, 'Size option created');
  }

  @Patch('admin/product-size-options/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body(new ZodValidationPipe(updateSizeOptionSchema)) input: z.infer<typeof updateSizeOptionSchema>) {
    const item = await this.productSizeOptionsService.update(id, input);
    return successResponse(item, 'Size option updated');
  }

  @Delete('admin/product-size-options/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    await this.productSizeOptionsService.remove(id);
    return successResponse(null, 'Size option removed');
  }
}
