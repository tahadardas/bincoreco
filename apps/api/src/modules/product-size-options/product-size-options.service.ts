import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ProductType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductSizeOptionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.productSizeOption.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.productSizeOption.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const option = await this.prisma.productSizeOption.findUnique({ where: { id } });
    if (!option) throw new NotFoundException('Product size option not found');
    return option;
  }

  async create(data: { code: string; nameAr: string; nameEn: string; sizeValue?: number | null; sizeUnit?: string; productType?: string; isActive?: boolean; sortOrder?: number }) {
    const existing = await this.prisma.productSizeOption.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException('Product size option already exists');
    const createData: any = { ...data };
    if (data.productType) createData.productType = data.productType as ProductType;
    return this.prisma.productSizeOption.create({ data: createData });
  }

  async update(id: string, data: { code?: string; nameAr?: string; nameEn?: string; sizeValue?: number | null; sizeUnit?: string; productType?: string; isActive?: boolean; sortOrder?: number }) {
    await this.findById(id);
    if (data.code) {
      const dup = await this.prisma.productSizeOption.findUnique({ where: { code: data.code } });
      if (dup && dup.id !== id) throw new ConflictException('Code already in use');
    }
    const updateData: any = { ...data };
    if (data.productType !== undefined) updateData.productType = data.productType ? data.productType as ProductType : null;
    return this.prisma.productSizeOption.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.productSizeOption.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
