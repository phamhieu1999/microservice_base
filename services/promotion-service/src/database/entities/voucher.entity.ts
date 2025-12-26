import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type VoucherScope = 'GLOBAL' | 'SHOP' | 'PRODUCT';
export type VoucherType = 'DISCOUNT' | 'FREESHIP' | 'LOYALTY_EXCHANGE';

@Entity({ name: 'vouchers' })
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'varchar', default: 'DISCOUNT' })
  type: VoucherType;

  @Column({ type: 'varchar', default: 'GLOBAL' })
  scope: VoucherScope;

  @Column({ nullable: true })
  shopId?: string;

  @Column({ nullable: true })
  productId?: string;

  @Column({ type: 'decimal' })
  discountValue: number;

  @Column({ type: 'decimal', nullable: true })
  maxDiscount?: number;

  @Column({ type: 'decimal', nullable: true })
  minOrderAmount?: number;

  @Column({ type: 'int', nullable: true })
  usageLimit?: number;

  @Column({ type: 'int', nullable: true })
  perUserLimit?: number;

  @Column({ type: 'timestamp', nullable: true })
  startAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
}


