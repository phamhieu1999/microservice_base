export interface LoyaltyPointsEarnedEvent {
  userId: string;
  points: number;
  source: string;
  referenceId: string;
  balanceAfter: number;
}

export const LOYALTY_POINTS_EARNED_TOPIC = 'loyalty.points.earned';
