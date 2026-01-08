import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export type DisputeStatus =
  | 'OPEN'
  | 'SELLER_RESPONDED'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'REJECTED';

@Entity({ name: 'disputes' })
export class Dispute {
  @ApiProperty({ description: 'Dispute unique identifier', example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'Order ID associated with dispute', example: 'order-123' })
  @Column()
  orderId!: string;

  @ApiProperty({ description: 'User ID who created the dispute', example: 'user-456' })
  @Column()
  userId!: string;

  @ApiProperty({ description: 'Seller ID involved in dispute', example: 'seller-789' })
  @Column()
  sellerId!: string;

  @ApiProperty({
    description: 'Dispute status',
    enum: ['OPEN', 'SELLER_RESPONDED', 'ESCALATED', 'RESOLVED', 'REJECTED'],
    example: 'OPEN',
  })
  @Column({ type: 'varchar', length: 20, default: 'OPEN' })
  status!: DisputeStatus;

  @ApiProperty({ description: 'Reason code for dispute', example: 'DAMAGED_ITEM' })
  @Column({ type: 'varchar', length: 50 })
  reasonCode!: string;

  @ApiProperty({ description: 'Detailed description of dispute', required: false, example: 'Item received was damaged' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Attachments metadata (JSON)', required: false })
  @Column({ type: 'jsonb', nullable: true })
  attachments?: any;

  @ApiProperty({ description: 'Resolution details', required: false, example: 'Refund approved' })
  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt!: Date;

  @ApiProperty({ description: 'Escalation timestamp', required: false })
  @Column({ type: 'timestamp', nullable: true })
  escalatedAt?: Date;

  @ApiProperty({ description: 'Resolution timestamp', required: false })
  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @ApiProperty({ description: 'User ID who created the dispute', required: false })
  @Column({ nullable: true })
  createdBy?: string;

  @ApiProperty({ description: 'User ID who last updated the dispute', required: false })
  @Column({ nullable: true })
  updatedBy?: string;
}
