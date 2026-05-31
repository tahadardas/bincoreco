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
});

const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'maestro', 'staff', 'customer']),
});

type UsersQuery = z.infer<typeof usersQuerySchema>;
type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'maestro')
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(@Query(new ZodValidationPipe(usersQuerySchema)) query: UsersQuery) {
    const { page, limit, search } = query;
    const result = await this.usersService.findAll({ page, limit, search });
    return paginatedResponse(result.items, result.total, result.page, result.limit);
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
}
