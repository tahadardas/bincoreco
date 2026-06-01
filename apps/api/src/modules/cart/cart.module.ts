import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CurrenciesModule } from '../currencies/currencies.module';
import { SecurityModule } from '../../common/auth/security.module';

@Module({
  imports: [CurrenciesModule, SecurityModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
