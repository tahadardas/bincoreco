import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  CreateProductInput,
  UpdateProductInput,
  createProductSchema,
  updateProductSchema,
} from '@banco-ricco/validators';
import { z } from 'zod';
import { ProductsService } from './products.service';
import { successResponse, paginatedResponse } from '../../common/response.interface';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthenticatedRequest } from '../../common/auth/authenticated-request.type';
import { getAuditContext } from '../../common/audit/audit-context';

const booleanQuerySchema = z.preprocess(value => {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}, z.boolean().optional());

const productsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  type: z.string().optional(),
  locale: z.enum(['ar', 'en']).optional(),
  search: z.string().optional(),
  isActive: booleanQuerySchema,
  isBestSeller: booleanQuerySchema,
  isMaestroPick: booleanQuerySchema,
});

const featuredProductsQuerySchema = z.object({
  locale: z.enum(['ar', 'en']).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

type ProductsQuery = z.infer<typeof productsQuerySchema>;
type FeaturedProductsQuery = z.infer<typeof featuredProductsQuerySchema>;

@ApiTags('Products')
@Controller()
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('products')
  async findAll(
    @Query(new ZodValidationPipe(productsQuerySchema)) query: ProductsQuery,
  ) {
    const { page, limit, categoryId, type, locale, search, isBestSeller, isMaestroPick } = query;
    const result = await this.productsService.findAll({
      page, limit, categoryId, type, locale, search,
      isActive: true,
      isBestSeller: isBestSeller ? true : undefined,
      isMaestroPick: isMaestroPick ? true : undefined,
    });
    return paginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Get('admin/products')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async findAllForAdmin(
    @Query(new ZodValidationPipe(productsQuerySchema)) query: ProductsQuery,
  ) {
    const { page, limit, categoryId, type, locale, search, isActive, isBestSeller, isMaestroPick } = query;
    const result = await this.productsService.findAll({
      page, limit, categoryId, type, locale, search, isActive, isBestSeller, isMaestroPick,
    });
    return paginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Get('products/best-sellers')
  async getBestSellers(@Query(new ZodValidationPipe(featuredProductsQuerySchema)) query: FeaturedProductsQuery) {
    const { locale, limit } = query;
    const result = await this.productsService.getBestSellers(locale, limit);
    return successResponse(result.items);
  }

  @Get('products/maestro-picks')
  async getMaestroPicks(@Query(new ZodValidationPipe(featuredProductsQuerySchema)) query: FeaturedProductsQuery) {
    const { locale, limit } = query;
    const result = await this.productsService.getMaestroPicks(locale, limit);
    return successResponse(result.items);
  }

  @Get('products/:id')
  async findById(@Param('id') id: string, @Query('locale') locale?: string) {
    const item = await this.productsService.findById(id, locale);
    return successResponse(item);
  }

  @Post('admin/products')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async create(
    @Body(new ZodValidationPipe(createProductSchema)) input: CreateProductInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const item = await this.productsService.create(input, getAuditContext(req));
    return successResponse(item, 'Product created');
  }

  @Patch('admin/products/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) input: UpdateProductInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const item = await this.productsService.update(id, input, getAuditContext(req));
    return successResponse(item, 'Product updated');
  }

  @Delete('admin/products/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.productsService.remove(id, getAuditContext(req));
    return successResponse(null, 'Product removed');
  }
}
