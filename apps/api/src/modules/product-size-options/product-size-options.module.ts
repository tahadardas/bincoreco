import { Module } from '@nestjs/common';
import { ProductSizeOptionsService } from './product-size-options.service';
import { ProductSizeOptionsController } from './product-size-options.controller';
import { SecurityModule } from '../../common/auth/security.module';

@Module({
  imports: [SecurityModule],
  controllers: [ProductSizeOptionsController],
  providers: [ProductSizeOptionsService],
  exports: [ProductSizeOptionsService],
})
export class ProductSizeOptionsModule {}
