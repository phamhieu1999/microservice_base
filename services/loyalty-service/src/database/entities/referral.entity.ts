import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

export type ReferralStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

@Entity({ name: 'referrals' })
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  referrerUserId: string;

  @Index({ unique: true })
  @Column()
  referralCode: string;

  @Index({ nullable: true })
  @Column({ nullable: true })
  referredUserId?: string;

  @Column({ type: 'int', default: 0 })
  pointsAwarded: number;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: ReferralStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;
}
