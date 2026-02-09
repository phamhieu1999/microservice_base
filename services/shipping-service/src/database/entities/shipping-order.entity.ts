import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ShippingQuote } from './shipping-quote.entity';

export type ShippingOrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';

@Entity({ name: 'shipping_orders' })
export class ShippingOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  orderId!: string;

  @ManyToOne(() => ShippingQuote)
  quote?: ShippingQuote;

  @Column()
  quoteId!: string;

  @Column({ type: 'varchar', default: 'PENDING' })
  status!: ShippingOrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  shippingFee!: number;

  @Column()
  trackingNumber!: string;

  @Column({ nullable: true })
  carrier?: string;

  @Column({ nullable: true })
  originAddress?: string;

  @Column()
  destinationAddress!: string;

  @Column({ nullable: true })
  recipientName?: string;

  @Column({ nullable: true })
  recipientPhone?: string;

  @Column({ type: 'timestamp', nullable: true })
  shippedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  trackingHistory?: Array<{
    status: string;
    location?: string;
    timestamp: Date;
    note?: string;
  }>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

