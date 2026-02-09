import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ShippingQuote } from './shipping-quote.entity';

export type ShippingMethodType = 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'SAME_DAY';
export type ShippingMethodStatus = 'ACTIVE' | 'INACTIVE';

@Entity({ name: 'shipping_methods' })
export class ShippingMethod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar' })
  type!: ShippingMethodType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseFee!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  perItemFee?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  perKgFee?: number;

  @Column({ type: 'int', default: 1 })
  estimatedDays!: number;

  @Column({ type: 'varchar', default: 'ACTIVE' })
  status!: ShippingMethodStatus;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => ShippingQuote, (quote) => quote.shippingMethod)
  quotes!: ShippingQuote[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

