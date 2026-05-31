import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { z } from 'zod';
import { BannersService } from './banners.service';
import { successResponse } from '../../common/response.interface';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const bannerTranslationSchema = z.object({
  locale: z.enum(['ar', 'en']),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
});

const createBannerSchema = z.object({
  imageUrl: z.string().min(1),
  mobileImageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  translations: z.array(bannerTranslationSchema).optional(),
});

const updateBannerSchema = createBannerSchema.partial();

type CreateBannerInput = z.infer<typeof createBannerSchema>;
type UpdateBannerInput = z.infer<typeof updateBannerSchema>;

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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async findAllAdmin() {
    const items = await this.bannersService.findAllAdmin();
    return successResponse(items);
  }

  @Post('admin/banners')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async create(@Body(new ZodValidationPipe(createBannerSchema)) input: CreateBannerInput) {
    const item = await this.bannersService.create(input);
    return successResponse(item, 'Banner created');
  }

  @Patch('admin/banners/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body(new ZodValidationPipe(updateBannerSchema)) input: UpdateBannerInput) {
    const item = await this.bannersService.update(id, input);
    return successResponse(item, 'Banner updated');
  }

  @Delete('admin/banners/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    await this.bannersService.remove(id);
    return successResponse(null, 'Banner deleted');
  }
}
