import { Injectable } from '@nestjs/common';
import { SellerRepository } from './seller.repository';
import { RegisterSellerDto } from './dto/register-seller.dto';

@Injectable()
export class SellerService {
  constructor(private readonly repo: SellerRepository) {}

  getMe(userId: string) {
    return this.repo.findByUserId(userId);
  }

  register(userId: string, dto: RegisterSellerDto) {
    return this.repo.registerSeller(userId, dto.shopName, dto.avatarUrl, dto.address);
  }

  getShop(id: string) {
    return this.repo.findShopById(id);
  }
}


