import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type DisputeStatus =
  | 'OPEN'
  | 'SELLER_RESPONDED'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'REJECTED';

@Entity({ name: 'disputes' })
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  userId: string;

  @Column()
  sellerId: string;

  @Column({ type: 'varchar', length: 20, default: 'OPEN' })
  status: DisputeStatus;

  @Column({ type: 'varchar', length: 50 })
  reasonCode: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: any;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  escalatedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column({ nullable: true })
  createdBy?: string;

  @Column({ nullable: true })
  updatedBy?: string;
}
