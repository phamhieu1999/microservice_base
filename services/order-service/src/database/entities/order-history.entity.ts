import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';
import { OrderStatus } from './order.entity';

@Entity({ name: 'order_history' })
export class OrderHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order)
  order!: Order;

  @Column()
  orderId!: string;

  @Column({ type: 'varchar' })
  status!: OrderStatus;

  @Column({ nullable: true })
  changedBy?: string; // userId

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
