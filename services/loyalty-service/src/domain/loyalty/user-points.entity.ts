export class UserPoints {
  constructor(
    public readonly userId: string,
    public totalPoints: number,
    public availablePoints: number,
    public tier: string,
    public lifetimePoints: number,
  ) {}

  addPoints(points: number) {
    this.totalPoints += points;
    this.availablePoints += points;
    this.lifetimePoints += points;
  }

  redeemPoints(points: number) {
    if (this.availablePoints < points) {
      throw new Error('Insufficient points');
    }
    this.totalPoints -= points;
    this.availablePoints -= points;
  }

  updateTier(tier: string) {
    this.tier = tier;
  }
}

