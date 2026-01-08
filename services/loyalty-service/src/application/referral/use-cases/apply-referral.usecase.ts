import { Inject, Injectable, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { ILoyaltyRepository } from '../../../domain/loyalty/loyalty.repository';
import { Referral } from '../../../domain/referral/referral.entity';
import { EarnPointsUseCase } from '../../loyalty/use-cases/earn-points.usecase';
import { KafkaService } from '../../../kafka/kafka.service';
import { TracingService } from '../../../common/tracing.service';

export interface ApplyReferralInput {
  referralCode: string;
  referredUserId: string; // User mới được giới thiệu
}

@Injectable()
export class ApplyReferralUseCase {
  constructor(
    @Inject('ILoyaltyRepository') private readonly repo: ILoyaltyRepository,
    private readonly earnPointsUseCase: EarnPointsUseCase,
    private readonly kafka: KafkaService,
    @Optional() private readonly tracing?: TracingService,
  ) {}

  async execute(input: ApplyReferralInput): Promise<{ referrerPoints: number; referredPoints: number }> {
    const referral = await this.repo.findReferralByCode(input.referralCode);
    
    if (!referral) {
      throw new NotFoundException('Referral code not found');
    }

    if (!referral.isActive) {
      throw new BadRequestException('Referral code is not active');
    }

    if (referral.referrerId === input.referredUserId) {
      throw new BadRequestException('Cannot use your own referral code');
    }

    if (referral.referredId) {
      throw new BadRequestException('Referral code already used');
    }

    // Cập nhật referral
    referral.setReferredId(input.referredUserId);
    referral.incrementReferrals();
    await this.repo.updateReferral(referral);

    // Thưởng điểm cho referrer (10,000 points)
    const referrerResult = await this.earnPointsUseCase.execute({
      userId: referral.referrerId,
      amount: 10000000, // 10M VND equivalent để earn 10,000 points
      referralId: referral.id,
      source: 'REFERRAL',
      description: `Referral bonus for ${input.referredUserId}`,
    });

    // Thưởng điểm cho referred user (5,000 points)
    const referredResult = await this.earnPointsUseCase.execute({
      userId: input.referredUserId,
      amount: 5000000, // 5M VND equivalent để earn 5,000 points
      referralId: referral.id,
      source: 'REFERRAL',
      description: `Welcome bonus from referral ${referral.referralCode}`,
    });

    // Cập nhật referral points earned
    referral.addPoints(referrerResult.points);
    await this.repo.updateReferral(referral);

    return {
      referrerPoints: referrerResult.points,
      referredPoints: referredResult.points,
    };
  }
}

