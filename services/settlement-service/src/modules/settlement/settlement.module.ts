import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerBalance } from '../../database/entities/seller-balance.entity';
import { CommissionConfig } from '../../database/entities/commission-config.entity';
import { PayoutRequest } from '../../database/entities/payout-request.entity';
import { SettlementService } from './settlement.service';
import { SettlementController } from './settlement.controller';
import { PaymentSettlementConsumer } from '../../kafka/payment.consumer';
import { KafkaService } from '../../kafka/kafka.service';

@Module({
  imports: [TypeOrmModule.forFeature([SellerBalance, CommissionConfig, PayoutRequest])],
  controllers: [SettlementController],
  providers: [SettlementService, PaymentSettlementConsumer, KafkaService],
})
export class SettlementModule {}
