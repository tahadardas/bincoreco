import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { SecurityModule } from '../../common/auth/security.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [SecurityModule, AuditLogsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
