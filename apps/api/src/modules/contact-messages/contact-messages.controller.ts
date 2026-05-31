import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { ContactMessagesService } from './contact-messages.service';
import { successResponse, paginatedResponse } from '../../common/response.interface';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const createContactMessageSchema = z.object({
  fullName: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  email: z.string().email().max(200).optional().or(z.literal('')),
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(2000),
});

const contactMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.string().optional(),
});

const updateContactMessageStatusSchema = z.object({
  status: z.enum(['NEW', 'READ', 'REPLIED', 'ARCHIVED']),
});

type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>;
type ContactMessagesQuery = z.infer<typeof contactMessagesQuerySchema>;

@ApiTags('Contact Messages')
@Controller()
export class ContactMessagesController {
  constructor(private contactMessagesService: ContactMessagesService) {}

  @Post('contact-messages')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async create(@Body(new ZodValidationPipe(createContactMessageSchema)) input: CreateContactMessageInput) {
    const msg = await this.contactMessagesService.create(input);
    return successResponse(msg, 'Message sent successfully');
  }

  @Get('admin/contact-messages')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async adminFindAll(@Query(new ZodValidationPipe(contactMessagesQuerySchema)) query: ContactMessagesQuery) {
    const result = await this.contactMessagesService.adminFindAll(query);
    return paginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Patch('admin/contact-messages/:id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateContactMessageStatusSchema)) body: any,
  ) {
    const msg = await this.contactMessagesService.updateStatus(id, body.status);
    return successResponse(msg, 'Status updated');
  }
}
