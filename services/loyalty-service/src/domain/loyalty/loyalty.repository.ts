import { UserPoints } from './user-points.entity';
import { PointTransaction } from './point-transaction.entity';
import { Referral } from '../referral/referral.entity';

export interface ILoyaltyRepository {
  findUserPoints(userId: string): Promise<UserPoints | null>;
  createUserPoints(userPoints: UserPoints): Promise<UserPoints>;
  updateUserPoints(userPoints: UserPoints): Promise<UserPoints>;
  createTransaction(transaction: PointTransaction): Promise<PointTransaction>;
  findTransactionsByUserId(userId: string, limit?: number, offset?: number): Promise<PointTransaction[]>;
  findReferralByCode(referralCode: string): Promise<Referral | null>;
  findReferralByReferrerId(referrerId: string): Promise<Referral | null>;
  createReferral(referral: Referral): Promise<Referral>;
  updateReferral(referral: Referral): Promise<Referral>;
}

