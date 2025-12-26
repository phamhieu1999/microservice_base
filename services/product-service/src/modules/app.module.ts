import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModule } from './product/product.module';
import { InventoryModule } from './inventory/inventory.module';
import { KafkaModule } from '../kafka/kafka.module';
import { CacheModule } from '../common/cache/cache.module';
import { OrderEventsConsumer } from '../kafka/order-events.consumer';
import { HealthController } from '../common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.PRODUCT_MONGO_URI || 'mongodb://mongo:27017/product_db', {
      maxPoolSize: parseInt(process.env.MONGO_POOL_MAX || '20', 10),
      minPoolSize: parseInt(process.env.MONGO_POOL_MIN || '5', 10),
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000', 10),
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT || '5000', 10),
    }),
    KafkaModule,
    CacheModule,
    ProductModule,
    InventoryModule,
  ],
  controllers: [HealthController],
  providers: [OrderEventsConsumer],
})
export class AppModule {}


