import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma, ReviewStatus, ReviewSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditActions, AuditLogContext } from '../audit-logs/audit-log.types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  async findByProduct(productId: string) {
    const reviews = await this.prisma.productReview.findMany({
      where: { productId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true } },
      },
    });

    const sanitized = reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isVerifiedPurchase: r.isVerifiedPurchase,
      adminReply: r.adminReply,
      helpfulCount: r.helpfulCount,
      createdAt: r.createdAt,
      user: r.user ? { fullName: r.user.fullName } : null,
      guestName: r.guestName,
    }));

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingsBreakdown = [0, 0, 0, 0, 0];
    reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) ratingsBreakdown[r.rating - 1]++; });

    return {
      reviews: sanitized,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingsBreakdown,
    };
  }

  async create(input: {
    productId: string;
    userId?: string;
    orderId?: string;
    rating: number;
    title?: string;
    comment?: string;
    guestName?: string;
    guestPhone?: string;
    orderNumber?: string;
    source?: ReviewSource;
  }, auditContext?: AuditLogContext) {
    if (input.rating < 1 || input.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const product = await this.prisma.product.findUnique({ where: { id: input.productId } });
    if (!product || product.deletedAt || !product.isActive) throw new NotFoundException('Product not found');

    let isVerifiedPurchase = false;
    let orderId = input.orderId;

    if (input.orderNumber) {
      const order = await this.prisma.order.findUnique({
        where: { orderNumber: input.orderNumber },
        include: { items: { select: { productId: true } } },
      });
      if (!order || !order.items.some(item => item.productId === input.productId)) {
        throw new BadRequestException('Order number is not valid for this product');
      }
      if (input.userId && order.customerId && order.customerId !== input.userId) {
        throw new ForbiddenException('Order does not belong to the authenticated user');
      }
      if (input.guestPhone && order.guestPhone && input.guestPhone !== order.guestPhone) {
        throw new ForbiddenException('Guest phone does not match this order');
      }
      orderId = order.id;
      isVerifiedPurchase = order.status === 'PICKED_UP';
    }

    if (input.userId) {
      const paidOrder = await this.prisma.order.findFirst({
        where: {
          customerId: input.userId,
          status: 'PICKED_UP',
          items: { some: { productId: input.productId } },
        },
      });
      if (paidOrder) {
        isVerifiedPurchase = true;
        orderId = orderId || paidOrder.id;
      }
    }

    const review = await this.prisma.productReview.create({
      data: {
        productId: input.productId,
        userId: input.userId || null,
        orderId: orderId || null,
        rating: input.rating,
        title: input.title || null,
        comment: input.comment || null,
        guestName: input.guestName || null,
        guestPhone: input.guestPhone || null,
        source: input.source || 'WEBSITE',
        status: input.userId ? 'PENDING' : 'PENDING',
        isVerifiedPurchase,
      },
    });

    await this.auditLogs.record({
      ...auditContext,
      action: AuditActions.REVIEW_CREATED,
      entityType: 'ProductReview',
      entityId: review.id,
      afterSnapshot: { id: review.id, productId: input.productId, rating: input.rating },
    });

    return this.toPublicReview(review);
  }

  private toPublicReview(review: {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    guestName: string | null;
    isVerifiedPurchase: boolean;
    adminReply: string | null;
    helpfulCount: number;
    createdAt: Date;
    userId?: string | null;
    orderId?: string | null;
    status?: ReviewStatus;
    source?: ReviewSource;
  }) {
    return {
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      guestName: review.guestName,
      isVerifiedPurchase: review.isVerifiedPurchase,
      adminReply: review.adminReply,
      helpfulCount: review.helpfulCount,
      createdAt: review.createdAt,
      status: review.status,
    };
  }

  async adminFindAll(params: {
    page?: number;
    limit?: number;
    status?: string;
    rating?: number;
    productId?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
    verifiedOnly?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductReviewWhereInput = {};
    if (params.status) where.status = params.status as ReviewStatus;
    if (params.rating) where.rating = params.rating;
    if (params.productId) where.productId = params.productId;
    if (params.verifiedOnly) where.isVerifiedPurchase = true;
    if (params.search) {
      where.OR = [
        { comment: { contains: params.search, mode: 'insensitive' } },
        { title: { contains: params.search, mode: 'insensitive' } },
        { guestName: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.fromDate || params.toDate) {
      where.createdAt = {};
      if (params.fromDate) where.createdAt.gte = new Date(params.fromDate);
      if (params.toDate) where.createdAt.lte = new Date(params.toDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, sku: true, imageUrl: true, translations: { take: 1 } },
          },
          user: { select: { id: true, fullName: true, email: true, phone: true } },
        },
      }),
      this.prisma.productReview.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async updateStatus(id: string, status: ReviewStatus, auditContext?: AuditLogContext) {
    const review = await this.prisma.productReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    const updated = await this.prisma.productReview.update({
      where: { id },
      data: { status },
    });

    const action = status === 'APPROVED' ? AuditActions.REVIEW_APPROVED : AuditActions.REVIEW_REJECTED;
    await this.auditLogs.record({
      ...auditContext,
      action,
      entityType: 'ProductReview',
      entityId: id,
      beforeSnapshot: { id: review.id, status: review.status },
      afterSnapshot: { id: updated.id, status: updated.status },
    });

    return updated;
  }

  async updateReply(id: string, adminReply: string, auditContext?: AuditLogContext) {
    const review = await this.prisma.productReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    const updated = await this.prisma.productReview.update({
      where: { id },
      data: { adminReply },
    });

    await this.auditLogs.record({
      ...auditContext,
      action: AuditActions.REVIEW_REPLIED,
      entityType: 'ProductReview',
      entityId: id,
      beforeSnapshot: { id: review.id, adminReply: review.adminReply },
      afterSnapshot: { id: updated.id, adminReply: updated.adminReply },
    });

    return updated;
  }

  async remove(id: string, auditContext?: AuditLogContext) {
    const review = await this.prisma.productReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    await this.prisma.productReview.delete({ where: { id } });

    await this.auditLogs.record({
      ...auditContext,
      action: AuditActions.REVIEW_DELETED,
      entityType: 'ProductReview',
      entityId: id,
      beforeSnapshot: { id: review.id },
    });
  }
}
