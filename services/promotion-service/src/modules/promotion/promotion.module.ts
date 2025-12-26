import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from '../../database/entities/voucher.entity';
import { VoucherUsage } from '../../database/entities/voucher-usage.entity';
import { PromotionController } from './promotion.controller';
import { PromotionLoyaltyController } from './promotion.loyalty.controller';
import { PromotionService } from './promotion.service';
import { PromotionRepository } from './promotion.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher, VoucherUsage])],
  controllers: [PromotionController, PromotionLoyaltyController],
  providers: [PromotionService, PromotionRepository],
})
export class PromotionModule {}


