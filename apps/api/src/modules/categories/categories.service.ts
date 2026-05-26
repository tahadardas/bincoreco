import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(locale?: string) {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        translations: locale ? { where: { locale } } : true,
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return categories;
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(data: {
    slug: string;
    imageUrl?: string;
    isActive?: boolean;
    sortOrder?: number;
    translations: { locale: string; name: string; description?: string }[];
  }) {
    return this.prisma.category.create({
      data: {
        slug: data.slug,
        imageUrl: data.imageUrl,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
        translations: {
          create: data.translations.map(t => ({
            locale: t.locale,
            name: t.name,
            description: t.description,
          })),
        },
      },
      include: { translations: true },
    });
  }

  async update(id: string, data: {
    slug?: string;
    imageUrl?: string;
    isActive?: boolean;
    sortOrder?: number;
    translations?: { locale: string; name: string; description?: string }[];
  }) {
    await this.findById(id);
    if (data.translations) {
      for (const t of data.translations) {
        await this.prisma.categoryTranslation.upsert({
          where: { categoryId_locale: { categoryId: id, locale: t.locale } },
          update: { name: t.name, description: t.description },
          create: { categoryId: id, locale: t.locale, name: t.name, description: t.description },
        });
      }
    }
    return this.prisma.category.update({
      where: { id },
      data: {
        slug: data.slug,
        imageUrl: data.imageUrl,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
      include: { translations: true },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
