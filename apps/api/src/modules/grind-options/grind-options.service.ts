import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GrindOptionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.grindOption.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.grindOption.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const option = await this.prisma.grindOption.findUnique({ where: { id } });
    if (!option) throw new NotFoundException('Grind option not found');
    return option;
  }

  async create(data: {
    code: string;
    nameAr: string;
    nameEn: string;
    descriptionAr?: string;
    descriptionEn?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    return this.prisma.grindOption.create({ data });
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.prisma.grindOption.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.grindOption.delete({ where: { id } });
  }
}
