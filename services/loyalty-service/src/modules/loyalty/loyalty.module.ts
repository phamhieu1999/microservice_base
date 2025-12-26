import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPoints } from '../../database/entities/user-points.entity';
import { PointTransaction } from '../../database/entities/point-transaction.entity';
import { PointTier } from '../../database/entities/point-tier.entity';
import { Referral } from '../../database/entities/referral.entity';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { PromotionClient } from '../../promotion/promotion.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPoints, PointTransaction, PointTier, Referral]),
    HttpModule,
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService, PromotionClient],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
