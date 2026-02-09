/** Pattern A: cặp request/reply cho từng thao tác */
export const INVENTORY_RESERVE_REQUEST_TOPIC = 'inventory.reserve.request';
export const INVENTORY_RESERVE_REPLY_TOPIC = 'inventory.reserve.reply';

export const PROMOTION_VALIDATE_REQUEST_TOPIC = 'promotion.validate.request';
export const PROMOTION_VALIDATE_REPLY_TOPIC = 'promotion.validate.reply';

/** Pattern B: một request, nhiều reply (aggregate) */
export const ORDER_PREPARE_REQUEST_TOPIC = 'order.prepare.request';
export const ORDER_PREPARE_REPLY_TOPIC = 'order.prepare.reply';
