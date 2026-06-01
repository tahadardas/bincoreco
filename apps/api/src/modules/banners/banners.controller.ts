import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { z } from 'zod';
import { BannersService } from './banners.service';
import { successResponse } from '../../common/response.interface';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const placementEnum = z.enum(['HOME_HERO', 'HOME_PROMO']);

const animationTypeEnum = z.enum([
  'fade',
  'slideLeft',
  'slideRight',
  'slideUp',
  'slideDown',
  'zoomIn',
  'parallax',
  'none',
]);

const displayModeEnum = z.enum([
  'fullWidthHero',
  'contained',
  'card',
  'splitImageText',
  'backgroundWithOverlay',
]);

const textPositionEnum = z.enum(['center', 'right', 'left', 'bottom']);

const textColorEnum = z.enum(['light', 'dark']);

const bannerTranslationSchema = z.object({
  locale: z.enum(['ar', 'en']),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
});

const bannerBaseSchema = z.object({
  placement: placementEnum.default('HOME_PROMO'),
  imageUrl: z.string().min(1),
  mobileImageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  ctaTextAr: z.string().max(200).optional(),
  ctaTextEn: z.string().max(200).optional(),
  ctaUrl: z.string().optional(),
  animationType: animationTypeEnum.default('fade'),
  displayMode: displayModeEnum.default('fullWidthHero'),
  overlayOpacity: z.coerce.number().min(0).max(1).default(0.35),
  textPosition: textPositionEnum.default('center'),
  textColor: textColorEnum.default('light'),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  translations: z.array(bannerTranslationSchema).optional(),
});

const dateRefine = (data: { startsAt?: string | null; endsAt?: string | null }) => {
  if (data.startsAt && data.endsAt) {
    return new Date(data.startsAt) < new Date(data.endsAt);
  }
  return true;
};

const createBannerSchema = bannerBaseSchema.refine(dateRefine, {
  message: 'endsAt must be after startsAt',
});

const updateBannerSchema = bannerBaseSchema.partial().refine(dateRefine, {
  message: 'endsAt must be after startsAt',
});

type CreateBannerInput = z.infer<typeof createBannerSchema>;
type UpdateBannerInput = z.infer<typeof updateBannerSchema>;

@ApiTags('Banners')
@Controller()
export class BannersController {
  constructor(private bannersService: BannersService) {}

  @Get('banners')
  async findAll(@Query('locale') locale?: string, @Query('placement') placement?: string) {
    const items = await this.bannersService.findAll(locale, placement);
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
