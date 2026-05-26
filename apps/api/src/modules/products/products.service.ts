import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    type?: string;
    locale?: string;
    isActive?: boolean;
    isBestSeller?: boolean;
    isMaestroPick?: boolean;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.type) where.type = params.type;
    if (params.isBestSeller) where.isBestSeller = true;
    if (params.isMaestroPick) where.isMaestroPick = true;
    if (params.search) {
      where.translations = {
        some: {
          name: { contains: params.search, mode: 'insensitive' },
          ...(params.locale ? { locale: params.locale } : {}),
        },
      };
    }

    const include: any = {
      translations: params.locale ? { where: { locale: params.locale } } : true,
      variants: {
        where: { isActive: true },
        include: { prices: { where: { isActive: true } } },
        orderBy: { sortOrder: 'asc' },
      },
      coffeeProfile: true,
      category: {
        include: {
          translations: params.locale ? { where: { locale: params.locale } } : true,
        },
      },
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({ where, include, skip, take: limit, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findById(id: string, locale?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        translations: locale ? { where: { locale } } : true,
        variants: {
          where: { isActive: true },
          include: { prices: { where: { isActive: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        coffeeProfile: true,
        category: {
          include: {
            translations: locale ? { where: { locale } } : true,
          },
        },
      },
    });
    if (!product || product.deletedAt) throw new NotFoundException('Product not found');
    return product;
  }

  async findBySku(sku: string) {
    return this.prisma.product.findUnique({ where: { sku } });
  }

  async create(data: {
    type: string;
    sku: string;
    categoryId: string;
    isActive?: boolean;
    isFeatured?: boolean;
    isBestSeller?: boolean;
    isMaestroPick?: boolean;
    imageUrl?: string;
    basePreparationTimeMinutes?: number;
    sortOrder?: number;
    translations: { locale: string; name: string; shortDescription?: string; description?: string }[];
    variants: {
      name: string;
      sizeValue?: number;
      sizeUnit?: string;
      isActive?: boolean;
      sortOrder?: number;
      prices: { currencyCode: string; amount: number }[];
    }[];
  }) {
    return this.prisma.product.create({
      data: {
        type: data.type as any,
        sku: data.sku,
        categoryId: data.categoryId,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        isBestSeller: data.isBestSeller ?? false,
        isMaestroPick: data.isMaestroPick ?? false,
        imageUrl: data.imageUrl,
        basePreparationTimeMinutes: data.basePreparationTimeMinutes ?? 15,
        sortOrder: data.sortOrder ?? 0,
        translations: {
          create: data.translations.map(t => ({
            locale: t.locale,
            name: t.name,
            shortDescription: t.shortDescription,
            description: t.description,
          })),
        },
        variants: {
          create: data.variants.map(v => ({
            name: v.name,
            sizeValue: v.sizeValue,
            sizeUnit: v.sizeUnit,
            isActive: v.isActive ?? true,
            sortOrder: v.sortOrder ?? 0,
            prices: {
              create: v.prices.map(p => ({
                currencyCode: p.currencyCode,
                amount: p.amount,
              })),
            },
          })),
        },
      },
      include: {
        translations: true,
        variants: { include: { prices: true } },
        coffeeProfile: true,
      },
    });
  }

  async update(id: string, data: any) {
    await this.findById(id);
    if (data.translations) {
      for (const t of data.translations) {
        await this.prisma.productTranslation.upsert({
          where: { productId_locale: { productId: id, locale: t.locale } },
          update: { name: t.name, shortDescription: t.shortDescription, description: t.description },
          create: { productId: id, locale: t.locale, name: t.name, shortDescription: t.shortDescription, description: t.description },
        });
      }
    }
    const updateData: any = {};
    if (data.type) updateData.type = data.type;
    if (data.sku) updateData.sku = data.sku;
    if (data.categoryId) updateData.categoryId = data.categoryId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.isBestSeller !== undefined) updateData.isBestSeller = data.isBestSeller;
    if (data.isMaestroPick !== undefined) updateData.isMaestroPick = data.isMaestroPick;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.basePreparationTimeMinutes) updateData.basePreparationTimeMinutes = data.basePreparationTimeMinutes;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        translations: true,
        variants: { include: { prices: true } },
        coffeeProfile: true,
      },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getBestSellers(locale?: string, limit = 10) {
    return this.findAll({ isBestSeller: true, locale, isActive: true, limit });
  }

  async getMaestroPicks(locale?: string, limit = 10) {
    return this.findAll({ isMaestroPick: true, locale, isActive: true, limit });
  }
}
