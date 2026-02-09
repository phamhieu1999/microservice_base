import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentMethod = 'CARD' | 'EWALLET' | 'BANK_TRANSFER' | 'COD';
export type PaymentProvider = 'VNPAY' | 'MOMO' | 'STRIPE' | 'MOCK';

// Enum objects for validation and Swagger
export enum PaymentMethodEnum {
  CARD = 'CARD',
  EWALLET = 'EWALLET',
  BANK_TRANSFER = 'BANK_TRANSFER',
  COD = 'COD',
}

export enum PaymentProviderEnum {
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  STRIPE = 'STRIPE',
  MOCK = 'MOCK',
}

@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  orderId!: string;

  @Column({ type: 'decimal' })
  amount!: number;

  @Column({ type: 'varchar', default: 'PENDING' })
  status!: PaymentStatus;

  @Column({ type: 'varchar', nullable: true })
  method?: PaymentMethod;

  @Column({ type: 'varchar', nullable: true })
  provider?: PaymentProvider;

  @Column({ nullable: true })
  providerTxnId?: string;

  @Column({ nullable: true, unique: true })
  idempotencyKey?: string; // Để tránh duplicate payment requests

  @Column({ type: 'decimal', nullable: true })
  refundedAmount?: number;

  @Column({ type: 'text', nullable: true })
  providerResponse?: string; // Lưu raw response từ provider

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


