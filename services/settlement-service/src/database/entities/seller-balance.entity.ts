import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'seller_balances' })
export class SellerBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sellerId: string;

  @Column({ type: 'decimal', default: 0 })
  availableAmount: number;

  @Column({ type: 'decimal', default: 0 })
  pendingAmount: number;
}
