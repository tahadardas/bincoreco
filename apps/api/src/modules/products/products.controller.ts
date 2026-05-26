import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { successResponse, paginatedResponse } from '../../common/response.interface';

@ApiTags('Products')
@Controller()
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('products')
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('categoryId') categoryId?: string,
    @Query('type') type?: string,
    @Query('locale') locale?: string,
    @Query('search') search?: string,
    @Query('isBestSeller') isBestSeller?: string,
    @Query('isMaestroPick') isMaestroPick?: string,
  ) {
    const result = await this.productsService.findAll({
      page, limit, categoryId, type, locale, search,
      isActive: true,
      isBestSeller: isBestSeller === 'true' ? true : undefined,
      isMaestroPick: isMaestroPick === 'true' ? true : undefined,
    });
    return paginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Get('products/best-sellers')
  async getBestSellers(@Query('locale') locale?: string, @Query('limit') limit?: number) {
    const result = await this.productsService.getBestSellers(locale, limit);
    return successResponse(result.items);
  }

  @Get('products/maestro-picks')
  async getMaestroPicks(@Query('locale') locale?: string, @Query('limit') limit?: number) {
    const result = await this.productsService.getMaestroPicks(locale, limit);
    return successResponse(result.items);
  }

  @Get('products/:id')
  async findById(@Param('id') id: string, @Query('locale') locale?: string) {
    const item = await this.productsService.findById(id, locale);
    return successResponse(item);
  }

  @Post('admin/products')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async create(@Body() input: any) {
    const item = await this.productsService.create(input);
    return successResponse(item, 'Product created');
  }

  @Patch('admin/products/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() input: any) {
    const item = await this.productsService.update(id, input);
    return successResponse(item, 'Product updated');
  }

  @Delete('admin/products/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
    return successResponse(null, 'Product removed');
  }
}
