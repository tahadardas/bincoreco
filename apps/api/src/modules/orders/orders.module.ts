import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CartModule } from '../cart/cart.module';
import { GuestCartModule } from '../guest-cart/guest-cart.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    CartModule,
    GuestCartModule,
    LoyaltyModule,
    AuditLogsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'banco-ricco-dev-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '15m' },
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
