import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductType } from '@prisma/client';
import { CreateProductInput, UpdateProductInput } from '@banco-ricco/validators';
import { PrismaService } from '../prisma/prisma.service';
import { AuditActions, AuditLogContext } from '../audit-logs/audit-log.types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

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

    const where: Prisma.ProductWhereInput = { deletedAt: null };
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.type) where.type = params.type as ProductType;
    if (params.isBestSeller !== undefined) where.isBestSeller = params.isBestSeller;
    if (params.isMaestroPick !== undefined) where.isMaestroPick = params.isMaestroPick;
    if (params.search) {
      where.translations = {
        some: {
          name: { contains: params.search, mode: 'insensitive' },
          ...(params.locale ? { locale: params.locale } : {}),
        },
      };
    }

    const include: Prisma.ProductInclude = {
      translations: params.locale ? { where: { locale: params.locale } } : true,
      variants: {
        where: { isActive: true },
        include: { prices: { where: { isActive: true } } },
        orderBy: { sortOrder: 'asc' },
      },
      coffeeProfile: true,
      grindOptions: {
        where: { isActive: true },
        include: { grindOption: true },
      },
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
        grindOptions: {
          where: { isActive: true },
          include: { grindOption: true },
        },
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

  async create(data: CreateProductInput, auditContext?: AuditLogContext) {
    const grindOptionIds = await this.validateProductGrindOptions(data.type as ProductType, data.grindOptionIds);

    const product = await this.prisma.product.create({
      data: {
        type: data.type as ProductType,
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
            microStory: t.microStory,
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
        grindOptions: grindOptionIds.length
          ? {
              create: grindOptionIds.map((grindOptionId, index) => ({
                grindOptionId,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        translations: true,
        variants: { include: { prices: true } },
        coffeeProfile: true,
        grindOptions: { include: { grindOption: true } },
      },
    });

    await this.auditLogs.record({
      ...auditContext,
      action: AuditActions.PRODUCT_CREATED,
      entityType: 'Product',
      entityId: product.id,
      afterSnapshot: product,
    });

    return product;
  }

  async update(id: string, data: UpdateProductInput, auditContext?: AuditLogContext) {
    const existing = await this.findById(id);
    const beforePriceSnapshot = this.getPriceSnapshot(existing);
    const nextType = (data.type || existing.type) as ProductType;
    const grindOptionIds = data.grindOptionIds !== undefined
      ? await this.validateProductGrindOptions(nextType, data.grindOptionIds)
      : data.type && nextType !== ProductType.COFFEE_BEAN
        ? []
        : undefined;

    if (data.translations) {
      for (const t of data.translations) {
        await this.prisma.productTranslation.upsert({
          where: { productId_locale: { productId: id, locale: t.locale } },
          update: { name: t.name, shortDescription: t.shortDescription, description: t.description, microStory: t.microStory },
          create: {
            productId: id,
            locale: t.locale,
            name: t.name,
            shortDescription: t.shortDescription,
            description: t.description,
            microStory: t.microStory,
          },
        });
      }
    }
    const updateData: Prisma.ProductUncheckedUpdateInput = {};
    if (data.type) updateData.type = data.type as ProductType;
    if (data.sku) updateData.sku = data.sku;
    if (data.categoryId) updateData.categoryId = data.categoryId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.isBestSeller !== undefined) updateData.isBestSeller = data.isBestSeller;
    if (data.isMaestroPick !== undefined) updateData.isMaestroPick = data.isMaestroPick;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.basePreparationTimeMinutes !== undefined) updateData.basePreparationTimeMinutes = data.basePreparationTimeMinutes;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        translations: true,
        variants: { include: { prices: true } },
        coffeeProfile: true,
        grindOptions: { include: { grindOption: true } },
      },
    });

    if (data.variants) {
      await this.updateVariants(id, data.variants);
    }

    if (grindOptionIds !== undefined) {
      await this.prisma.productGrindOption.deleteMany({ where: { productId: id } });
      if (grindOptionIds.length) {
        await this.prisma.productGrindOption.createMany({
          data: grindOptionIds.map((grindOptionId, index) => ({
            productId: id,
            grindOptionId,
            sortOrder: index,
          })),
          skipDuplicates: true,
        });
      }

    }

    const updated = await this.findById(id);
    const afterPriceSnapshot = this.getPriceSnapshot(updated);

    await this.auditLogs.record({
      ...auditContext,
      action: AuditActions.PRODUCT_UPDATED,
      entityType: 'Product',
      entityId: id,
      beforeSnapshot: existing,
      afterSnapshot: updated,
    });

    if (JSON.stringify(beforePriceSnapshot) !== JSON.stringify(afterPriceSnapshot)) {
      await this.auditLogs.record({
        ...auditContext,
        action: AuditActions.PRICE_CHANGED,
        entityType: 'Product',
        entityId: id,
        beforeSnapshot: beforePriceSnapshot,
        afterSnapshot: afterPriceSnapshot,
      });
    }

    return updated;
  }

  async remove(id: string, auditContext?: AuditLogContext) {
    const existing = await this.findById(id);
    const removed = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogs.record({
      ...auditContext,
      action: AuditActions.PRODUCT_DISABLED,
      entityType: 'Product',
      entityId: id,
      beforeSnapshot: existing,
      afterSnapshot: removed,
    });

    return removed;
  }

  async getBestSellers(locale?: string, limit = 10) {
    return this.findAll({ isBestSeller: true, locale, isActive: true, limit });
  }

  async getMaestroPicks(locale?: string, limit = 10) {
    return this.findAll({ isMaestroPick: true, locale, isActive: true, limit });
  }

  private async validateProductGrindOptions(type: ProductType, grindOptionIds?: string[]) {
    const uniqueIds = [...new Set(grindOptionIds || [])];
    if (!uniqueIds.length) {
      return [];
    }

    if (type !== ProductType.COFFEE_BEAN) {
      throw new BadRequestException('Grind options can only be linked to coffee bean products');
    }

    const options = await this.prisma.grindOption.findMany({
      where: {
        id: { in: uniqueIds },
        isActive: true,
      },
    });

    if (options.length !== uniqueIds.length) {
      throw new BadRequestException('One or more grind options are invalid or inactive');
    }

    if (options.some(option => option.code === 'WHOLE_BEAN')) {
      throw new BadRequestException('Whole bean is selected through grindType and should not be linked as a grind option');
    }

    return uniqueIds;
  }

  private async updateVariants(productId: string, variants: UpdateProductInput['variants']) {
    if (!variants?.length) {
      return;
    }

    const existingVariants = await this.prisma.productVariant.findMany({
      where: { productId },
      include: { prices: true },
      orderBy: { sortOrder: 'asc' },
    });

    for (const [index, variantInput] of variants.entries()) {
      const existingVariant = existingVariants[index];
      const variant = existingVariant
        ? await this.prisma.productVariant.update({
            where: { id: existingVariant.id },
            data: {
              name: variantInput.name,
              sizeValue: variantInput.sizeValue,
              sizeUnit: variantInput.sizeUnit,
              isActive: variantInput.isActive ?? existingVariant.isActive,
              sortOrder: variantInput.sortOrder ?? existingVariant.sortOrder,
            },
          })
        : await this.prisma.productVariant.create({
            data: {
              productId,
              name: variantInput.name,
              sizeValue: variantInput.sizeValue,
              sizeUnit: variantInput.sizeUnit,
              isActive: variantInput.isActive ?? true,
              sortOrder: variantInput.sortOrder ?? index,
            },
          });

      for (const priceInput of variantInput.prices || []) {
        const existingPrice = existingVariant?.prices.find(price => price.currencyCode === priceInput.currencyCode);
        if (existingPrice) {
          await this.prisma.price.update({
            where: { id: existingPrice.id },
            data: {
              amount: priceInput.amount,
              isActive: true,
            },
          });
        } else {
          await this.prisma.price.create({
            data: {
              productVariantId: variant.id,
              currencyCode: priceInput.currencyCode,
              amount: priceInput.amount,
              isActive: true,
            },
          });
        }
      }
    }
  }

  private getPriceSnapshot(product: Awaited<ReturnType<ProductsService['findById']>>) {
    return product.variants.map(variant => ({
      variantId: variant.id,
      name: variant.name,
      prices: variant.prices.map(price => ({
        id: price.id,
        currencyCode: price.currencyCode,
        amount: price.amount.toString(),
        isActive: price.isActive,
      })),
    }));
  }
}
