import { BadRequestException, Injectable } from '@nestjs/common';
import { PromotionRepository } from './promotion.repository';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';
import { ApplyVoucherDto } from './dto/apply-voucher.dto';

@Injectable()
export class PromotionService {
  constructor(private readonly repo: PromotionRepository) {}

  async validate(dto: ValidateVoucherDto) {
    const voucher = await this.repo.findByCode(dto.code);
    if (!voucher) {
      throw new BadRequestException('Voucher not found');
    }

    const now = new Date();
    if (voucher.startAt && voucher.startAt > now) {
      throw new BadRequestException('Voucher not started');
    }
    if (voucher.endAt && voucher.endAt < now) {
      throw new BadRequestException('Voucher expired');
    }

    const usageCount = await this.repo.countUsage(voucher.id);
    if (voucher.usageLimit && usageCount >= voucher.usageLimit) {
      throw new BadRequestException('Voucher usage limit reached');
    }

    const userUsage = await this.repo.countUsageByUser(voucher.id, dto.userId);
    if (voucher.perUserLimit && userUsage >= voucher.perUserLimit) {
      throw new BadRequestException('Voucher per-user limit reached');
    }

    // Tính tổng theo scope (GLOBAL / SHOP / PRODUCT)
    let total = 0;
    if (voucher.scope === 'SHOP' && voucher.shopId) {
      total = dto.items
        .filter((i) => i.sellerId === voucher.shopId)
        .reduce((s, i) => s + i.price * i.quantity, 0);
    } else if (voucher.scope === 'PRODUCT' && voucher.productId) {
      total = dto.items
        .filter((i) => i.productId === voucher.productId)
        .reduce((s, i) => s + i.price * i.quantity, 0);
    } else {
      total = dto.items.reduce((s, i) => s + i.price * i.quantity, 0);
    }

    if (voucher.minOrderAmount && total < Number(voucher.minOrderAmount)) {
      throw new BadRequestException('Order amount too low for this voucher');
    }

    // Đơn giản: discountValue là % nếu <= 1, ngược lại là số tiền cố định
    let discountAmount: number;
    if (voucher.type === 'DISCOUNT' || voucher.type === 'LOYALTY_EXCHANGE') {
      if (Number(voucher.discountValue) <= 1) {
        discountAmount = total * Number(voucher.discountValue);
      } else {
        discountAmount = Number(voucher.discountValue);
      }
      if (voucher.maxDiscount && discountAmount > Number(voucher.maxDiscount)) {
        discountAmount = Number(voucher.maxDiscount);
      }
    } else {
      // FREESHIP: ở đây tạm thời coi như giảm một khoản cố định vào tổng,
      // phần shippingFee thực tế sẽ được tính ở Shipping Service.
      discountAmount = Number(voucher.discountValue);
      if (voucher.maxDiscount && discountAmount > Number(voucher.maxDiscount)) {
        discountAmount = Number(voucher.maxDiscount);
      }
    }

    return {
      voucherId: voucher.id,
      discountAmount,
      finalAmount: total - discountAmount,
    };
  }

  async apply(dto: ApplyVoucherDto) {
    await this.repo.createUsage(dto.voucherId, dto.userId);
    return { success: true };
  }
}



  // Tạo voucher đổi từ điểm Loyalty
  async createLoyaltyVoucher(userId: string, points: number) {
    // Simple rule: 100 points -> 10k discount
    const discountValue = Math.floor(points / 100) * 10000;
    if (discountValue <= 0) {
      throw new BadRequestException('Not enough points to exchange');
    }

    const code = `LOYALTY-${userId}-${Date.now()}`;
    const voucher = await this.repo.createVoucher({
      code,
      type: 'LOYALTY_EXCHANGE',
      scope: 'GLOBAL',
      discountValue,
      maxDiscount: discountValue,
      minOrderAmount: 0,
    });

    return { code: voucher.code, discountValue };
  }
