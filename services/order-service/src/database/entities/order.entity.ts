import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';

// Trạng thái chi tiết hơn, mô phỏng flow giống các sàn TMĐT (Shopee-like)
export type OrderStatus =
  | 'PENDING' // tạo đơn nhưng chưa thanh toán (online) hoặc chưa xác nhận (COD)
  | 'PAID' // đã thanh toán online
  | 'PROCESSING' // đang chuẩn bị hàng (gộp AWAITING_CONFIRMATION / PACKING đơn giản)
  | 'SHIPPED' // đã bàn giao cho đơn vị vận chuyển
  | 'OUT_FOR_DELIVERY' // đang giao
  | 'DELIVERED' // đã giao thành công
  | 'COMPLETED' // hết thời gian khiếu nại / user xác nhận
  | 'CANCELLED' // hủy chung
  | 'PAYMENT_EXPIRED' // quá hạn thanh toán
  | 'BUYER_CANCEL_REQUESTED' // người mua yêu cầu hủy
  | 'SELLER_CANCELLED' // người bán chủ động hủy
  | 'SYSTEM_CANCELLED' // hệ thống tự hủy (timeout, vi phạm, ...)
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURN_REJECTED'
  | 'RETURN_IN_TRANSIT'
  | 'RETURN_RECEIVED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  orderGroupId?: string;

  @Column({ nullable: true })
  voucherId?: string;

  @Column({ type: 'decimal', nullable: true })
  discountAmount?: number;

  @Column({ type: 'decimal', nullable: true })
  shippingFee?: number;

  @Column({ type: 'decimal' })
  totalAmount: number;

  @Column({ type: 'varchar', default: 'PENDING' })
  status: OrderStatus;

  @Column({ nullable: true })
  cancellationReason?: string;

  @Column({ nullable: true })
  cancelledBy?: string; // userId who cancelled

  @Column({ nullable: true })
  cancelledAt?: Date;

  @Column({ nullable: true })
  trackingNumber?: string;

  @Column({ nullable: true })
  shippedAt?: Date;

  @Column({ nullable: true })
  deliveredAt?: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


