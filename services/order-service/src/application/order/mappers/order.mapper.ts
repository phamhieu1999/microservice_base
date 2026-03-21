import { Order } from '../../../domain/order/order.entity';
import { Order as OrderOrm } from '../../../database/entities/order.entity';

export function ormToDomain(orm: OrderOrm): Order {
  return new Order(
    orm.id,
    orm.userId,
    orm.status,
    Number(orm.totalAmount),
    orm.items?.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      sellerId: i.sellerId,
    })) ?? [],
    orm.orderGroupId,
    orm.voucherId,
    orm.discountAmount ? Number(orm.discountAmount) : undefined,
    orm.shippingFee ? Number(orm.shippingFee) : undefined,
    orm.paymentMethod,
  );
}


