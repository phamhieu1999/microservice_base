import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller, SellerStatus } from '../../database/entities/seller.entity';
import { Shop } from '../../database/entities/shop.entity';

@Injectable()
export class SellerRepository {
  constructor(
    @InjectRepository(Seller)
    private readonly sellerRepo: Repository<Seller>,
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
  ) {}

  // Seller methods
  findByUserId(userId: string) {
    return this.sellerRepo.findOne({ where: { userId }, relations: ['shops'] });
  }

  findSellerById(id: string) {
    return this.sellerRepo.findOne({ where: { id }, relations: ['shops'] });
  }

  async findAllSellers(status?: SellerStatus, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    const [data, total] = await this.sellerRepo.findAndCount({
      where,
      relations: ['shops'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

  async updateSellerStatus(id: string, status: SellerStatus) {
    await this.sellerRepo.update(id, { status });
    return this.findSellerById(id);
  }

  // Shop methods
  async createShop(sellerId: string, name: string, avatarUrl?: string, address?: string) {
    const shop = this.shopRepo.create({
      sellerId,
      name,
      avatarUrl,
      address,
    });
    return this.shopRepo.save(shop);
  }

  findShopById(id: string) {
    return this.shopRepo.findOne({ where: { id }, relations: ['seller'] });
  }

  findShopsBySellerId(sellerId: string) {
    return this.shopRepo.find({ where: { sellerId }, order: { createdAt: 'DESC' } });
  }

  async findAllShops(sellerId?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const where = sellerId ? { sellerId } : {};
    const [data, total] = await this.shopRepo.findAndCount({
      where,
      relations: ['seller'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateShop(id: string, dto: { name?: string; avatarUrl?: string; address?: string }) {
    await this.shopRepo.update(id, dto);
    return this.findShopById(id);
  }

  async deleteShop(id: string) {
    await this.shopRepo.delete(id);
    return { message: 'Shop deleted successfully' };
  }
}


