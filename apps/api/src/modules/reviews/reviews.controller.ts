import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { z } from 'zod';
import { ReviewsService } from './reviews.service';
import { successResponse, paginatedResponse } from '../../common/response.interface';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthenticatedRequest } from '../../common/auth/authenticated-request.type';
import { getAuditContext } from '../../common/audit/audit-context';

const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
  guestName: z.string().max(100).optional(),
  guestPhone: z.string().max(20).optional(),
  orderNumber: z.string().optional(),
});

const adminReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  productId: z.string().uuid().optional(),
  search: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  verifiedOnly: z.coerce.boolean().optional(),
});

const updateReviewStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

const updateReviewReplySchema = z.object({
  adminReply: z.string().min(1).max(2000),
});

type CreateReviewInput = z.infer<typeof createReviewSchema>;
type AdminReviewsQuery = z.infer<typeof adminReviewsQuerySchema>;
type UpdateReviewStatusInput = z.infer<typeof updateReviewStatusSchema>;
type UpdateReviewReplyInput = z.infer<typeof updateReviewReplySchema>;

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get('products/:productId/reviews')
  async findByProduct(@Param('productId') productId: string) {
    const data = await this.reviewsService.findByProduct(productId);
    return successResponse(data);
  }

  @Post('products/:productId/reviews')
  async create(
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(createReviewSchema)) input: CreateReviewInput,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const review = await this.reviewsService.create({
      productId,
      userId,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      guestName: input.guestName,
      guestPhone: input.guestPhone,
    });
    return successResponse(review, 'Review submitted successfully');
  }

  @Get('admin/reviews')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async adminFindAll(@Query(new ZodValidationPipe(adminReviewsQuerySchema)) query: AdminReviewsQuery) {
    const result = await this.reviewsService.adminFindAll(query);
    return paginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Patch('admin/reviews/:id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateReviewStatusSchema)) input: UpdateReviewStatusInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const review = await this.reviewsService.updateStatus(id, input.status as any, getAuditContext(req));
    return successResponse(review, 'Review status updated');
  }

  @Patch('admin/reviews/:id/reply')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async updateReply(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateReviewReplySchema)) input: UpdateReviewReplyInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const review = await this.reviewsService.updateReply(id, input.adminReply, getAuditContext(req));
    return successResponse(review, 'Reply added');
  }

  @Delete('admin/reviews/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.reviewsService.remove(id, getAuditContext(req));
    return successResponse(null, 'Review deleted');
  }
}
