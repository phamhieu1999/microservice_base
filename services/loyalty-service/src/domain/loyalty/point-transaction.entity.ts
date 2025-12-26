export type TransactionType = 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'REFUNDED';
export type TransactionSource = 'PURCHASE' | 'REFERRAL' | 'BONUS' | 'REDEMPTION' | 'REFUND';

export class PointTransaction {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly points: number,
    public readonly type: TransactionType,
    public readonly source: TransactionSource,
    public readonly description?: string,
    public readonly orderId?: string,
    public readonly paymentId?: string,
    public readonly referralId?: string,
    public readonly voucherId?: string,
    public readonly expiresAt?: Date,
    public readonly createdAt?: Date,
  ) {}
}

