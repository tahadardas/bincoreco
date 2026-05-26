import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminLoyaltyController } from './admin-loyalty.controller';
import { AdminService } from './admin.service';
import { OrdersModule } from '../orders/orders.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [OrdersModule, LoyaltyModule],
  controllers: [AdminController, AdminLoyaltyController],
  providers: [AdminService],
})
export class AdminModule {}
