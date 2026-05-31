import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  CreateGrindOptionInput,
  UpdateGrindOptionInput,
  createGrindOptionSchema,
  updateGrindOptionSchema,
} from '@banco-ricco/validators';
import { GrindOptionsService } from './grind-options.service';
import { successResponse } from '../../common/response.interface';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthenticatedRequest } from '../../common/auth/authenticated-request.type';
import { getAuditContext } from '../../common/audit/audit-context';

@ApiTags('Grind Options')
@Controller()
export class GrindOptionsController {
  constructor(private grindOptionsService: GrindOptionsService) {}

  @Get('grind-options')
  async findAll() {
    const items = await this.grindOptionsService.findAll();
    return successResponse(items);
  }

  @Get('admin/grind-options')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async findAllAdmin() {
    const items = await this.grindOptionsService.findAllAdmin();
    return successResponse(items);
  }

  @Post('admin/grind-options')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async create(@Body(new ZodValidationPipe(createGrindOptionSchema)) input: CreateGrindOptionInput) {
    const item = await this.grindOptionsService.create(input);
    return successResponse(item, 'Grind option created');
  }

  @Patch('admin/grind-options/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateGrindOptionSchema)) input: UpdateGrindOptionInput,
    @Req() req: AuthenticatedRequest,
  ) {
    const item = await this.grindOptionsService.update(id, input, getAuditContext(req));
    return successResponse(item, 'Grind option updated');
  }

  @Delete('admin/grind-options/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.grindOptionsService.remove(id, getAuditContext(req));
    return successResponse(null, 'Grind option deleted');
  }
}
