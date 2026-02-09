import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SellerRepository } from './seller.repository';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { SellerStatus } from '../../database/entities/seller.entity';

@Injectable()
export class SellerService {
  constructor(private readonly repo: SellerRepository) {}

  // Seller methods
  getMe(userId: string) {
    return this.repo.findByUserId(userId);
  }

  register(userId: string, dto: RegisterSellerDto) {
    return this.repo.registerSeller(userId, dto.shopName, dto.avatarUrl, dto.address);
  }

  async getAllSellers(status?: string, page: number = 1, limit: number = 10) {
    return this.repo.findAllSellers(status as SellerStatus, page, limit);
  }

  getSellerById(id: string) {
    return this.repo.findSellerById(id);
  }

  async updateSellerStatus(id: string, status: SellerStatus) {
    const seller = await this.repo.findSellerById(id);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    return this.repo.updateSellerStatus(id, status);
  }

  // Shop methods
  async createShop(userId: string, dto: CreateShopDto) {
    const seller = await this.repo.findByUserId(userId);
    if (!seller) {
      throw new NotFoundException('Seller not found. Please register as seller first.');
    }
    if (seller.status !== 'APPROVED') {
      throw new ForbiddenException('Seller must be approved to create shops');
    }
    return this.repo.createShop(seller.id, dto.name, dto.avatarUrl, dto.address);
  }

  async getShops(sellerId?: string, page: number = 1, limit: number = 10) {
    return this.repo.findAllShops(sellerId, page, limit);
  }

  getShop(id: string) {
    return this.repo.findShopById(id);
  }

  async getMyShops(userId: string) {
    const seller = await this.repo.findByUserId(userId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    return this.repo.findShopsBySellerId(seller.id);
  }

  async updateShop(userId: string, shopId: string, dto: UpdateShopDto) {
    const seller = await this.repo.findByUserId(userId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    const shop = await this.repo.findShopById(shopId);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    if (shop.sellerId !== seller.id) {
      throw new ForbiddenException('You can only update your own shops');
    }
    return this.repo.updateShop(shopId, dto);
  }

  async deleteShop(userId: string, shopId: string) {
    const seller = await this.repo.findByUserId(userId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    const shop = await this.repo.findShopById(shopId);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    if (shop.sellerId !== seller.id) {
      throw new ForbiddenException('You can only delete your own shops');
    }
    return this.repo.deleteShop(shopId);
  }
}


