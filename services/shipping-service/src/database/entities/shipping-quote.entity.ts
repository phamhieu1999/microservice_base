import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ShippingMethod } from './shipping-method.entity';

export type ShippingQuoteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

@Entity({ name: 'shipping_quotes' })
export class ShippingQuote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  orderId?: string;

  @ManyToOne(() => ShippingMethod, (method) => method.quotes)
  shippingMethod!: ShippingMethod;

  @Column()
  shippingMethodId!: string;

  @Column({ type: 'varchar', default: 'PENDING' })
  status!: ShippingQuoteStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalFee!: number;

  @Column({ type: 'int' })
  estimatedDays!: number;

  @Column({ nullable: true })
  originAddress?: string;

  @Column({ nullable: true })
  destinationAddress?: string;

  @Column({ type: 'jsonb', nullable: true })
  breakdown?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}

