import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from '../../database/entities/seller.entity';
import { Shop } from '../../database/entities/shop.entity';

@Injectable()
export class SellerRepository {
  constructor(
    @InjectRepository(Seller)
    private readonly sellerRepo: Repository<Seller>,
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
  ) {}

  findByUserId(userId: string) {
    return this.sellerRepo.findOne({ where: { userId }, relations: ['shops'] });
  }

  async registerSeller(userId: string, shopName: string, avatarUrl?: string, address?: string) {
    let seller = await this.findByUserId(userId);
    if (!seller) {
      seller = this.sellerRepo.create({ userId, status: 'PENDING' });
      seller = await this.sellerRepo.save(seller);
    }
    const shop = this.shopRepo.create({
      sellerId: seller.id,
      name: shopName,
      avatarUrl,
      address,
    });
    await this.shopRepo.save(shop);
    return this.findByUserId(userId);
  }

  findShopById(id: string) {
    return this.shopRepo.findOne({ where: { id } });
  }
}


