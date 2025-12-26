import { Inject, Injectable, BadRequestException, Optional } from '@nestjs/common';
import { ILoyaltyRepository } from '../../../domain/loyalty/loyalty.repository';
import { UserPoints } from '../../../domain/loyalty/user-points.entity';
import { PointTransaction, TransactionType, TransactionSource } from '../../../domain/loyalty/point-transaction.entity';
import { KafkaService } from '../../../kafka/kafka.service';
import { TracingService } from '../../../common/tracing.service';
import { v4 as uuidv4 } from 'uuid';

export interface RedeemPointsInput {
  userId: string;
  points: number;
  voucherId?: string;
  description?: string;
}

@Injectable()
export class RedeemPointsUseCase {
  constructor(
    @Inject('ILoyaltyRepository') private readonly repo: ILoyaltyRepository,
    private readonly kafka: KafkaService,
    @Optional() private readonly tracing?: TracingService,
  ) {}

  async execute(input: RedeemPointsInput): Promise<{ success: boolean; remainingPoints: number }> {
    const userPoints = await this.repo.findUserPoints(input.userId);
    
    if (!userPoints) {
      throw new BadRequestException('User points not found');
    }

    if (userPoints.availablePoints < input.points) {
      throw new BadRequestException('Insufficient points');
    }

    if (input.points <= 0) {
      throw new BadRequestException('Points must be greater than 0');
    }

    // Redeem points
    userPoints.redeemPoints(input.points);
    await this.repo.updateUserPoints(userPoints);

    // Tạo transaction
    const transaction = new PointTransaction(
      uuidv4(),
      input.userId,
      -input.points, // Negative for redemption
      'REDEEMED' as TransactionType,
      'REDEMPTION' as TransactionSource,
      input.description || `Redeemed ${input.points} points`,
      undefined,
      undefined,
      undefined,
      input.voucherId,
      undefined,
      new Date(),
    );
    await this.repo.createTransaction(transaction);

    // Emit event
    await this.kafka.emit('points.redeemed', {
      userId: input.userId,
      points: input.points,
      remainingPoints: userPoints.availablePoints,
      voucherId: input.voucherId,
    });

    return { success: true, remainingPoints: userPoints.availablePoints };
  }
}

