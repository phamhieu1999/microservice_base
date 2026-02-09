import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

export type PointTransactionType = 'EARN' | 'REDEEM' | 'ADJUST' | 'REFERRAL';

@Entity({ name: 'point_transactions' })
export class PointTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  userId!: string;

  @Column({ type: 'int' })
  points!: number;

  @Column({ type: 'varchar', length: 20 })
  type!: PointTransactionType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  source?: string; // ORDER, PROMO, REFERRAL, ADMIN

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceId?: string; // orderId, promoId, referralId, etc.

  @Column({ type: 'int', default: 0 })
  balanceAfter!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
