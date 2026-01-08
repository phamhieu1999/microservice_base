import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthProxyModule } from './auth-proxy/auth-proxy.module';
import { ProductProxyModule } from './product-proxy/product-proxy.module';
import { OrderProxyModule } from './order-proxy/order-proxy.module';
import { CartProxyModule } from './cart-proxy/cart-proxy.module';
import { ReviewProxyModule } from './review-proxy/review-proxy.module';
import { SellerProxyModule } from './seller-proxy/seller-proxy.module';
import { SettlementProxyModule } from './settlement-proxy/settlement-proxy.module';
import { ChatProxyModule } from './chat-proxy/chat-proxy.module';
import { NotificationProxyModule } from './notification-proxy/notification-proxy.module';
import { SearchProxyModule } from './search-proxy/search-proxy.module';
import { LoyaltyProxyModule } from './loyalty-proxy/loyalty-proxy.module';
import { WarehouseProxyModule } from './warehouse-proxy/warehouse-proxy.module';
import { ShippingProxyModule } from './shipping-proxy/shipping-proxy.module';
import { PaymentProxyModule } from './payment-proxy/payment-proxy.module';
import { HomeModule } from './home/home.module';
import { AdminProxyModule } from './admin-proxy/admin-proxy.module';
import { PromotionProxyModule } from './promotion-proxy/promotion-proxy.module';
import { DisputeProxyModule } from './dispute-proxy/dispute-proxy.module';
import { DLQProxyModule } from './dlq-proxy/dlq-proxy.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from '../common/health.controller';
import { CacheModule } from '../common/cache/cache.module';
import { CacheInterceptor } from '../common/cache/cache.interceptor';
import { CircuitBreakerModule } from '../common/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 100, // default 100 requests / 60s per IP (global)
      },
      { name: 'auth', ttl: 60, limit: 5 }, // 5 req/min cho auth
      { name: 'search', ttl: 60, limit: 30 }, // 30 req/min cho search
      { name: 'order', ttl: 60, limit: 10 }, // 10 req/min cho order
    ]),
    CacheModule,
    CircuitBreakerModule,
    HttpModule,
    AuthModule,
    AuthProxyModule,
    ProductProxyModule,
    OrderProxyModule,
    CartProxyModule,
    ReviewProxyModule,
    SellerProxyModule,
    SettlementProxyModule,
    ChatProxyModule,
    NotificationProxyModule,
    SearchProxyModule,
    LoyaltyProxyModule,
    WarehouseProxyModule,
    ShippingProxyModule,
    PaymentProxyModule,
    PromotionProxyModule,
    DisputeProxyModule,
    DLQProxyModule,
    HomeModule,
    AdminProxyModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}


