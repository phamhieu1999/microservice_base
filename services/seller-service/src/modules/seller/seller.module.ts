import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seller } from '../../database/entities/seller.entity';
import { Shop } from '../../database/entities/shop.entity';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { SellerRepository } from './seller.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Seller, Shop])],
  controllers: [SellerController],
  providers: [SellerService, SellerRepository],
})
export class SellerModule {}


