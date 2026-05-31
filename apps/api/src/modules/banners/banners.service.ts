import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async findAll(locale?: string) {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      include: {
        translations: locale ? { where: { locale } } : true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.banner.findMany({
      include: { translations: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const banner = await this.prisma.banner.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!banner) throw new NotFoundException('Banner not found');
    return banner;
  }

  async create(data: {
    imageUrl: string;
    mobileImageUrl?: string;
    linkUrl?: string;
    ctaTextAr?: string;
    ctaTextEn?: string;
    ctaUrl?: string;
    animationType?: string;
    displayMode?: string;
    overlayOpacity?: number;
    textPosition?: string;
    textColor?: string;
    startsAt?: string | null;
    endsAt?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    translations?: { locale: string; title?: string; subtitle?: string }[];
  }) {
    return this.prisma.banner.create({
      data: {
        imageUrl: data.imageUrl,
        mobileImageUrl: data.mobileImageUrl,
        linkUrl: data.linkUrl,
        ctaTextAr: data.ctaTextAr,
        ctaTextEn: data.ctaTextEn,
        ctaUrl: data.ctaUrl,
        animationType: data.animationType ?? 'fade',
        displayMode: data.displayMode ?? 'fullWidthHero',
        overlayOpacity: data.overlayOpacity ?? 0.35,
        textPosition: data.textPosition ?? 'center',
        textColor: data.textColor ?? 'light',
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
        translations: data.translations ? {
          create: data.translations,
        } : undefined,
      },
      include: { translations: true },
    });
  }

  async update(id: string, data: {
    imageUrl?: string;
    mobileImageUrl?: string;
    linkUrl?: string;
    ctaTextAr?: string;
    ctaTextEn?: string;
    ctaUrl?: string;
    animationType?: string;
    displayMode?: string;
    overlayOpacity?: number;
    textPosition?: string;
    textColor?: string;
    startsAt?: string | null;
    endsAt?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    translations?: { locale: string; title?: string; subtitle?: string }[];
  }) {
    await this.findById(id);
    if (data.translations) {
      for (const t of data.translations) {
        await this.prisma.bannerTranslation.upsert({
          where: { bannerId_locale: { bannerId: id, locale: t.locale } },
          update: { title: t.title, subtitle: t.subtitle },
          create: { bannerId: id, locale: t.locale, title: t.title, subtitle: t.subtitle },
        });
      }
    }
    const updateData: any = {};
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.mobileImageUrl !== undefined) updateData.mobileImageUrl = data.mobileImageUrl;
    if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl;
    if (data.ctaTextAr !== undefined) updateData.ctaTextAr = data.ctaTextAr;
    if (data.ctaTextEn !== undefined) updateData.ctaTextEn = data.ctaTextEn;
    if (data.ctaUrl !== undefined) updateData.ctaUrl = data.ctaUrl;
    if (data.animationType !== undefined) updateData.animationType = data.animationType;
    if (data.displayMode !== undefined) updateData.displayMode = data.displayMode;
    if (data.overlayOpacity !== undefined) updateData.overlayOpacity = data.overlayOpacity;
    if (data.textPosition !== undefined) updateData.textPosition = data.textPosition;
    if (data.textColor !== undefined) updateData.textColor = data.textColor;
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null;
    if (data.endsAt !== undefined) updateData.endsAt = data.endsAt ? new Date(data.endsAt) : null;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    return this.prisma.banner.update({
      where: { id },
      data: updateData,
      include: { translations: true },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.banner.delete({ where: { id } });
  }
}
