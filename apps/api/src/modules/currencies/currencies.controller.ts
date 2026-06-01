import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { z } from 'zod';
import { CurrenciesService } from './currencies.service';
import { successResponse } from '../../common/response.interface';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const currencySchema = z.object({
  code: z.string()
    .trim()
    .transform(value => value.toUpperCase())
    .pipe(z.string().length(3).regex(/^[A-Z]{3}$/)),
  name: z.string().min(1).max(100),
  nameAr: z.string().optional(),
  nameEn: z.string().optional(),
  symbol: z.string().min(1).max(10),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

const updateCurrencySchema = currencySchema.partial().omit({ code: true });

@ApiTags('Currencies')
@Controller()
export class CurrenciesController {
  constructor(private currenciesService: CurrenciesService) {}

  @Get('currencies')
  async findAllActive() {
    const items = await this.currenciesService.findAllActive();
    return successResponse(items);
  }

  @Get('admin/currencies')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async findAllAdmin() {
    const items = await this.currenciesService.findAllAdmin();
    return successResponse(items);
  }

  @Post('admin/currencies')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async create(@Body(new ZodValidationPipe(currencySchema)) input: z.infer<typeof currencySchema>) {
    const item = await this.currenciesService.create(input);
    return successResponse(item, 'Currency created');
  }

  @Patch('admin/currencies/:code')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async update(@Param('code') code: string, @Body(new ZodValidationPipe(updateCurrencySchema)) input: z.infer<typeof updateCurrencySchema>) {
    const item = await this.currenciesService.update(code.toUpperCase(), input);
    return successResponse(item, 'Currency updated');
  }

  @Delete('admin/currencies/:code')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'maestro')
  @ApiBearerAuth()
  async remove(@Param('code') code: string) {
    const result = await this.currenciesService.remove(code.toUpperCase());
    return successResponse(result);
  }
}
