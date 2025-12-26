import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Payment } from '../../database/entities/payment.entity';
import { PaymentRepository } from './payment.repository';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { ProcessOrderCreatedUseCase } from '../../application/payment/use-cases/process-order-created.usecase';
import { PromotionClient } from '../../promotion/promotion.client';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { MockProvider } from './providers/mock.provider';
import { VNPayProvider } from './providers/vnpay.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), HttpModule],
  controllers: [PaymentController],
  providers: [
    PaymentRepository,
    PaymentService,
    ProcessOrderCreatedUseCase,
    PromotionClient,
    PaymentProviderFactory,
    MockProvider,
    VNPayProvider,
  ],
  exports: [PaymentService, ProcessOrderCreatedUseCase],
})
export class PaymentModule {}


