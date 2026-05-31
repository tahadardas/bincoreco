import { Module } from '@nestjs/common';
import { GuestCartService } from './guest-cart.service';
import { GuestCartController } from './guest-cart.controller';

@Module({
  controllers: [GuestCartController],
  providers: [GuestCartService],
  exports: [GuestCartService],
})
export class GuestCartModule {}
