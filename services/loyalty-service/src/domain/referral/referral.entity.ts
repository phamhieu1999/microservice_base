export class Referral {
  constructor(
    public readonly id: string,
    public readonly referrerId: string,
    public readonly referralCode: string,
    public pointsEarned: number,
    public totalReferrals: number,
    public isActive: boolean,
    public referredId?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  addPoints(points: number) {
    this.pointsEarned += points;
  }

  incrementReferrals() {
    this.totalReferrals += 1;
  }

  setReferredId(userId: string) {
    this.referredId = userId;
  }
}

