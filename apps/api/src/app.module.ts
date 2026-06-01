import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { GrindOptionsModule } from './modules/grind-options/grind-options.module';
import { GuestCartModule } from './modules/guest-cart/guest-cart.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';
import { SettingsModule } from './modules/settings/settings.module';
import { HealthModule } from './modules/health/health.module';
import { BannersModule } from './modules/banners/banners.module';
import { MediaModule } from './modules/media/media.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ContactMessagesModule } from './modules/contact-messages/contact-messages.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { ProductSizeOptionsModule } from './modules/product-size-options/product-size-options.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    GrindOptionsModule,
    GuestCartModule,
    CartModule,
    OrdersModule,
    ReportsModule,
    AdminModule,
    SettingsModule,
    BannersModule,
    MediaModule,
    LoyaltyModule,
    ReviewsModule,
    ContactMessagesModule,
    CurrenciesModule,
    ProductSizeOptionsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
