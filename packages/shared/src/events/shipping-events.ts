export interface ShippingOrderCreatedEvent {
  orderId: string;
  shippingOrderId: string;
  trackingNumber: string;
}

export interface ShippingStatusUpdatedEvent {
  orderId: string;
  shippingOrderId: string;
  trackingNumber: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
}

export const SHIPPING_ORDER_CREATED_TOPIC = 'shipping.order.created';
export const SHIPPING_STATUS_UPDATED_TOPIC = 'shipping.order.status.updated';
