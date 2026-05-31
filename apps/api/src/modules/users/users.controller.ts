import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { z } from 'zod';
import { UsersService } from './users.service';
import { successResponse, paginatedResponse } from '../../common/response.interface';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthenticatedRequest } from '../../common/auth/authenticated-request.type';
import { getAuditContext } from '../../common/audit/audit-context';

const usersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  role: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'maestro', 'staff', 'customer']),
});

const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().max(500).optional(),
});

type UsersQuery = z.infer<typeof usersQuerySchema>;
type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'maestro')
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(@Query(new ZodValidationPipe(usersQuerySchema)) query: UsersQuery) {
    const { page, limit, search, role, isActive, fromDate, toDate } = query;
    const result = await this.usersService.findAll({ page, limit, search, role, isActive, fromDate, toDate });
    return paginatedResponse(result.items, result.total, result.page, result.limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findByIdWithDetails(id);
    return successResponse(user);
  }

  @Patch(':id/role')
  @Roles('admin')
  async updateRole(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserRoleSchema)) input: UpdateUserRoleInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.updateRole(id, input.role, getAuditContext(req));
    return successResponse(user, 'User role updated');
  }

  @Patch(':id/status')
  @Roles('admin')
  async updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserStatusSchema)) input: UpdateUserStatusInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.updateStatus(id, input.isActive, input.reason, getAuditContext(req));
    return successResponse(user, 'User status updated');
  }
}
