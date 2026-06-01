import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CurrenciesService {
  constructor(private prisma: PrismaService) {}

  async findAllActive() {
    return this.prisma.currency.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.currency.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findByCode(code: string) {
    const currency = await this.prisma.currency.findUnique({ where: { code } });
    if (!currency) throw new NotFoundException('Currency not found');
    return currency;
  }

  async getDefaultCurrencyCode() {
    const defaultCurrency = await this.prisma.currency.findFirst({
      where: { isDefault: true, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    if (defaultCurrency) return defaultCurrency.code;

    const activeCurrency = await this.prisma.currency.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    if (activeCurrency) return activeCurrency.code;

    const legacySetting = await this.prisma.setting.findUnique({ where: { key: 'default_currency' } });
    return legacySetting?.value || 'SYP';
  }

  async create(data: { code: string; name: string; nameAr?: string; nameEn?: string; symbol: string; isDefault?: boolean; isActive?: boolean; sortOrder?: number }) {
    const code = data.code.toUpperCase().trim();
    const existing = await this.prisma.currency.findUnique({ where: { code } });
    if (existing) throw new ConflictException('Currency already exists');

    if (data.isDefault && data.isActive === false) {
      throw new BadRequestException('Default currency must be active');
    }

    return this.prisma.$transaction(async tx => {
      if (data.isDefault) {
        await tx.currency.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.currency.create({
        data: {
          ...data,
          code,
          isActive: data.isDefault ? true : data.isActive,
        },
      });
    });
  }

  async update(code: string, data: { name?: string; nameAr?: string; nameEn?: string; symbol?: string; isDefault?: boolean; isActive?: boolean; sortOrder?: number }) {
    const existing = await this.findByCode(code);
    if (existing.isDefault && data.isActive === false) {
      throw new BadRequestException('Cannot deactivate the default currency');
    }
    if (data.isDefault === false && existing.isDefault) {
      throw new BadRequestException('Assign another default currency before unsetting this one');
    }
    if (data.isDefault && data.isActive === false) {
      throw new BadRequestException('Default currency must be active');
    }

    return this.prisma.$transaction(async tx => {
      if (data.isDefault) {
        await tx.currency.updateMany({
          where: { isDefault: true, code: { not: code } },
          data: { isDefault: false },
        });
      }

      return tx.currency.update({
        where: { code },
        data: {
          ...data,
          isActive: data.isDefault ? true : data.isActive,
        },
      });
    });
  }

  async remove(code: string) {
    const currency = await this.findByCode(code);
    if (currency.isDefault) {
      throw new BadRequestException('Cannot delete default currency');
    }
    const priceCount = await this.prisma.price.count({ where: { currencyCode: code } });
    if (priceCount > 0) {
      await this.prisma.currency.update({
        where: { code },
        data: { isActive: false },
      });
      return { message: 'Currency has prices; deactivated instead of deleted' };
    }
    await this.prisma.currency.delete({ where: { code } });
    return { message: 'Currency deleted' };
  }
}
