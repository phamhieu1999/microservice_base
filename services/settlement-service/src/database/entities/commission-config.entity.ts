import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'commission_configs' })
export class CommissionConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  sellerId?: string;

  @Column({ nullable: true })
  categoryId?: string;

  @Column({ type: 'decimal', default: 0 })
  commissionRate!: number; // 0.1 = 10%
}
