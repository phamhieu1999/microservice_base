import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

@Entity({ name: 'user_points' })
export class UserPoints {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  userId: string;

  @Column({ type: 'int', default: 0 })
  balance: number;

  @Column({ type: 'varchar', length: 20, default: 'BRONZE' })
  tier: LoyaltyTier;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
