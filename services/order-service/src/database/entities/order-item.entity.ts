import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity({ name: 'order_items' })
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (order) => order.items)
  order!: Order;

  @Column()
  productId!: string;

  @Column({ nullable: true })
  sellerId?: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'decimal' })
  unitPrice!: number;
}


