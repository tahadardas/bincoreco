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
    linkUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
    translations?: { locale: string; title?: string; subtitle?: string }[];
  }) {
    return this.prisma.banner.create({
      data: {
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
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
    linkUrl?: string;
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
    return this.prisma.banner.update({
      where: { id },
      data: {
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
      include: { translations: true },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.banner.delete({ where: { id } });
  }
}
