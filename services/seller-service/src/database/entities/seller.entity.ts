import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Shop } from './shop.entity';

export type SellerStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

@Entity({ name: 'sellers' })
export class Seller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'varchar', default: 'PENDING' })
  status: SellerStatus;

  @OneToMany(() => Shop, (shop) => shop.seller)
  shops: Shop[];

  @CreateDateColumn()
  createdAt: Date;
}


