import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma, ProductType } from '@prisma/client';
import { CreateProductInput, UpdateProductInput } from '@banco-ricco/validators';
import { PrismaService } from '../prisma/prisma.service';
import { AuditActions, AuditLogContext } from '../audit-logs/audit-log.types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CurrenciesService } from '../currencies/currencies.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
    private currenciesService: CurrenciesService,
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
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
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
        images: { orderBy: { sortOrder: 'asc' } },
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

  async findPublicById(id: string, locale?: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true, deletedAt: null },
      include: {
        translations: locale ? { where: { locale } } : true,
        images: { orderBy: { sortOrder: 'asc' } },
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
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findBySku(sku: string) {
    return this.prisma.product.findUnique({ where: { sku } });
  }

  async create(data: CreateProductInput, auditContext?: AuditLogContext) {
    const grindOptionIds = await this.validateProductGrindOptions(data.type as ProductType, data.grindOptionIds);
    if (data.variants) {
      await this.validateVariantCurrencies(data.variants);
    }
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
        images: data.images?.length ? {
          create: data.images.map((img, i) => ({
            url: img.url,
            altAr: img.altAr,
            altEn: img.altEn,
            sortOrder: i,
            isPrimary: i === 0,
          })),
        } : undefined,
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
      : data.type && nextType !== ProductType.COFFEE_BEAN && nextType !== ProductType.GROUND_COFFEE
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
      await this.validateVariantCurrencies(data.variants);
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

    if (type !== ProductType.COFFEE_BEAN && type !== ProductType.GROUND_COFFEE) {
      throw new BadRequestException('Grind options can only be linked to coffee bean or ground coffee products');
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

  private async validateVariantCurrencies(variants: { name?: string; prices?: { currencyCode: string; amount: number }[] }[]) {
    const allCodes = [...new Set(variants.flatMap(v => v.prices?.map(p => p.currencyCode.toUpperCase()) || []))];
    if (!allCodes.length) return;

    const currencies = await this.prisma.currency.findMany({
      where: { code: { in: allCodes }, isActive: true },
    });
    const activeCodes = new Set(currencies.map(c => c.code));
    const invalidCodes = allCodes.filter(c => !activeCodes.has(c));
    if (invalidCodes.length) {
      throw new UnprocessableEntityException(
        `العملات التالية غير موجودة أو غير مفعلة: ${invalidCodes.join(', ')}. أضفها من صفحة إدارة العملات.`,
      );
    }

    for (const variant of variants) {
      const codes = variant.prices?.map(p => p.currencyCode) || [];
      const uniqueCodes = new Set(codes);
      if (uniqueCodes.size !== codes.length) {
        throw new BadRequestException('لا يمكن تكرار نفس العملة في نفس الخيار');
      }
      for (const price of variant.prices || []) {
        if (price.amount <= 0) {
          throw new BadRequestException(`السعر بالعملة ${price.currencyCode} يجب أن يكون أكبر من صفر`);
        }
      }
    }

    const defaultCurrencyCode = await this.currenciesService.getDefaultCurrencyCode();
    for (const variant of variants) {
      const codes = variant.prices?.map(p => p.currencyCode) || [];
      if (!codes.includes(defaultCurrencyCode)) {
        throw new BadRequestException(
          `الخيار "${variant.name || 'بدون اسم'}" يجب أن يحتوي على سعر بالعملة الافتراضية (${defaultCurrencyCode})`,
        );
      }
    }
  }

  private async updateVariants(productId: string, variants: UpdateProductInput['variants']) {
    if (!variants?.length) {
      return;
    }

    const existingVariants = await this.prisma.productVariant.findMany({
      where: { productId },
      include: { prices: true },
    });

    const existingMap = new Map(existingVariants.map(v => [v.id, v]));

    for (const [index, variantInput] of variants.entries()) {
      const variantId = variantInput.id;
      if (variantId && !existingMap.has(variantId)) {
        throw new BadRequestException('Variant does not belong to this product');
      }

      if (variantId) {
        const existingVariant = existingMap.get(variantId)!;
        const variant = await this.prisma.productVariant.update({
          where: { id: variantId },
          data: {
            name: variantInput.name,
            sizeValue: variantInput.sizeValue,
            sizeUnit: variantInput.sizeUnit,
            isActive: variantInput.isActive ?? existingVariant.isActive,
            sortOrder: variantInput.sortOrder ?? existingVariant.sortOrder,
          },
        });

        for (const priceInput of variantInput.prices || []) {
          const existingPrice = priceInput.id
            ? existingVariant.prices.find(p => p.id === priceInput.id)
            : existingVariant.prices.find(p => p.currencyCode === priceInput.currencyCode);
          if (priceInput.id && !existingPrice) {
            throw new BadRequestException('Price does not belong to this variant');
          }
          if (existingPrice) {
            await this.prisma.price.update({
              where: { id: existingPrice.id },
              data: { currencyCode: priceInput.currencyCode, amount: priceInput.amount, isActive: true },
            });
          } else {
            await this.prisma.price.create({
              data: { productVariantId: variant.id, currencyCode: priceInput.currencyCode, amount: priceInput.amount, isActive: true },
            });
          }
        }
      } else {
        const variant = await this.prisma.productVariant.create({
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

  async addImage(productId: string, url: string, altAr?: string, altEn?: string) {
    const product = await this.findById(productId);
    const count = await this.prisma.productImage.count({ where: { productId } });
    const image = await this.prisma.productImage.create({
      data: {
        productId,
        url,
        altAr,
        altEn,
        sortOrder: count,
        isPrimary: count === 0,
      },
    });
    if (image.isPrimary) {
      await this.prisma.product.update({ where: { id: productId }, data: { imageUrl: url } });
    }
    return image;
  }

  async updateImage(imageId: string, data: { altAr?: string; altEn?: string; sortOrder?: number }) {
    return this.prisma.productImage.update({ where: { id: imageId }, data });
  }

  async deleteImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.productId !== productId) throw new NotFoundException('Image not found');
    const wasPrimary = image.isPrimary;
    await this.prisma.productImage.delete({ where: { id: imageId } });
    if (wasPrimary) {
      const next = await this.prisma.productImage.findFirst({
        where: { productId },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) {
        await this.prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
        await this.prisma.product.update({ where: { id: productId }, data: { imageUrl: next.url } });
      } else {
        await this.prisma.product.update({ where: { id: productId }, data: { imageUrl: null } });
      }
    }
  }

  async setPrimaryImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.productId !== productId) throw new NotFoundException('Image not found');
    await this.prisma.productImage.updateMany({
      where: { productId, isPrimary: true },
      data: { isPrimary: false },
    });
    await this.prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } });
    await this.prisma.product.update({ where: { id: productId }, data: { imageUrl: image.url } });
    return image;
  }

  async reorderImages(productId: string, imageIds: string[]) {
    for (let i = 0; i < imageIds.length; i++) {
      await this.prisma.productImage.updateMany({
        where: { id: imageIds[i], productId },
        data: { sortOrder: i },
      });
    }
  }
}
