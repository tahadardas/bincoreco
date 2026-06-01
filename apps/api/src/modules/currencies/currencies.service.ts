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

  async create(data: { code: string; name: string; nameAr?: string; nameEn?: string; symbol: string; isDefault?: boolean; isActive?: boolean; sortOrder?: number }) {
    const code = data.code.toUpperCase().trim();
    const existing = await this.prisma.currency.findUnique({ where: { code } });
    if (existing) throw new ConflictException('Currency already exists');

    if (data.isDefault) {
      await this.clearDefault();
    }

    return this.prisma.currency.create({
      data: { ...data, code },
    });
  }

  async update(code: string, data: { name?: string; nameAr?: string; nameEn?: string; symbol?: string; isDefault?: boolean; isActive?: boolean; sortOrder?: number }) {
    await this.findByCode(code);
    if (data.isDefault) {
      await this.clearDefault();
    }
    return this.prisma.currency.update({
      where: { code },
      data,
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

  private async clearDefault() {
    await this.prisma.currency.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }
}
