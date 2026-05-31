import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactMessagesService {
  constructor(private prisma: PrismaService) {}

  async create(input: {
    fullName: string;
    phone: string;
    email?: string;
    subject?: string;
    message: string;
    source?: string;
  }) {
    return this.prisma.contactMessage.create({
      data: {
        fullName: input.fullName,
        phone: input.phone,
        email: input.email || null,
        subject: input.subject || null,
        message: input.message,
        source: input.source || 'WEBSITE',
      },
    });
  }

  async adminFindAll(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async updateStatus(id: string, status: string) {
    const msg = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) throw new NotFoundException('Message not found');
    return this.prisma.contactMessage.update({
      where: { id },
      data: { status },
    });
  }
}
