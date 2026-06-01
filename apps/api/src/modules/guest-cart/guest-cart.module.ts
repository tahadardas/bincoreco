import { Module } from '@nestjs/common';
import { GuestCartService } from './guest-cart.service';
import { GuestCartController } from './guest-cart.controller';
import { CurrenciesModule } from '../currencies/currencies.module';

@Module({
  imports: [CurrenciesModule],
  controllers: [GuestCartController],
  providers: [GuestCartService],
  exports: [GuestCartService],
})
export class GuestCartModule {}
