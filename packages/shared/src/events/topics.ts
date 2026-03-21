export { ORDER_CREATED_TOPIC, ORDER_CANCELLED_TOPIC } from './order-events';
export { PAYMENT_SUCCESS_TOPIC, PAYMENT_FAILED_TOPIC, PAYMENT_REFUND_SUCCESS_TOPIC } from './payment-events';
export { SHIPPING_ORDER_CREATED_TOPIC, SHIPPING_STATUS_UPDATED_TOPIC } from './shipping-events';
export { USER_CREATED_TOPIC } from './user-events';
export { LOYALTY_POINTS_EARNED_TOPIC } from './loyalty-events';

export const INVENTORY_RESERVE_REQUEST_TOPIC = 'inventory.reserve.request';
export const INVENTORY_RESERVE_REPLY_TOPIC = 'inventory.reserve.reply';
export const PROMOTION_VALIDATE_REQUEST_TOPIC = 'promotion.validate.request';
export const PROMOTION_VALIDATE_REPLY_TOPIC = 'promotion.validate.reply';
export const DLQ_FAILED_MESSAGES_TOPIC = 'dlq.failed-messages';
