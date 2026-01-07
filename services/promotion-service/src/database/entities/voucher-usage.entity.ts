import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'voucher_usages' })
export class VoucherUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  voucherId!: string;

  @Column()
  userId!: string;

  @CreateDateColumn()
  usedAt!: Date;
}


