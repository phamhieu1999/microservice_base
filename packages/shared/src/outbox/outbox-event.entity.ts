import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type OutboxEventStatus = 'PENDING' | 'PUBLISHED' | 'FAILED';

@Entity({ name: 'outbox_events' })
@Index('idx_outbox_pending', ['status', 'createdAt'], {
  where: `"status" = 'PENDING'`,
})
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  aggregateType!: string;

  @Column({ type: 'varchar', length: 255 })
  aggregateId!: string;

  @Column({ type: 'varchar', length: 255 })
  topic!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status!: OutboxEventStatus;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'int', default: 0 })
  retryCount!: number;

  @Column({ type: 'text', nullable: true })
  lastError?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
