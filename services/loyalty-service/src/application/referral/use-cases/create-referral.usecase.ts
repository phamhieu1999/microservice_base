import { Inject, Injectable, BadRequestException, Optional } from '@nestjs/common';
import { ILoyaltyRepository } from '../../../domain/loyalty/loyalty.repository';
import { Referral } from '../../../domain/referral/referral.entity';
import { KafkaService } from '../../../kafka/kafka.service';
import { TracingService } from '../../../common/tracing.service';
import { v4 as uuidv4 } from 'uuid';

export interface CreateReferralInput {
  referrerId: string;
  referralCode?: string; // Optional, sẽ generate nếu không có
}

@Injectable()
export class CreateReferralUseCase {
  constructor(
    @Inject('ILoyaltyRepository') private readonly repo: ILoyaltyRepository,
    private readonly kafka: KafkaService,
    @Optional() private readonly tracing?: TracingService,
  ) {}

  async execute(input: CreateReferralInput): Promise<Referral> {
    // Kiểm tra xem user đã có referral code chưa
    const existing = await this.repo.findReferralByReferrerId(input.referrerId);
    if (existing) {
      return existing;
    }

    // Generate referral code nếu không có
    const referralCode = input.referralCode || this.generateReferralCode(input.referrerId);

    // Kiểm tra code đã tồn tại chưa
    const existingCode = await this.repo.findReferralByCode(referralCode);
    if (existingCode) {
      throw new BadRequestException('Referral code already exists');
    }

    const referral = new Referral(
      uuidv4(),
      input.referrerId,
      referralCode,
      0,
      0,
      true,
      undefined, // referredId
      new Date(),
      new Date(),
    );

    const saved = await this.repo.createReferral(referral);
    return saved;
  }

  private generateReferralCode(userId: string): string {
    // Tạo code từ userId (lấy 8 ký tự đầu) + random
    const prefix = userId.substring(0, 8).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${random}`;
  }
}

