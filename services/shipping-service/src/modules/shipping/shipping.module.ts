import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { ShippingMethod } from '../../database/entities/shipping-method.entity';
import { ShippingQuote } from '../../database/entities/shipping-quote.entity';
import { ShippingOrder } from '../../database/entities/shipping-order.entity';
import { KafkaService } from '../../kafka/kafka.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShippingMethod, ShippingQuote, ShippingOrder]),
  ],
  controllers: [ShippingController],
  providers: [ShippingService, KafkaService],
  exports: [ShippingService],
})
export class ShippingModule {}


