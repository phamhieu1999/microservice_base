// Logger
export { JsonLoggerService } from './logger/json-logger.service';

// Health
export { createHealthController } from './health/health.controller';

// Circuit Breaker
export { CircuitBreakerService, CircuitBreakerConfig, CircuitState } from './circuit-breaker/circuit-breaker.service';
export { CircuitBreakerModule } from './circuit-breaker/circuit-breaker.module';

// Outbox
export { OutboxEvent, OutboxEventStatus } from './outbox/outbox-event.entity';
export { OutboxService, SaveOutboxEventInput } from './outbox/outbox.service';
export { OutboxRelayService, IKafkaEmitter, KAFKA_EMITTER } from './outbox/outbox-relay.service';
export { OutboxModule } from './outbox/outbox.module';

// Kafka
export { KafkaProducerService, KafkaServiceConfig } from './kafka/kafka.service';

// Events - Order
export { OrderCreatedEvent, OrderCancelledEvent, ORDER_CREATED_TOPIC, ORDER_CANCELLED_TOPIC } from './events/order-events';

// Events - Payment
export {
  PaymentSuccessEvent, PaymentFailedEvent, PaymentRefundSuccessEvent,
  SellerShare, PAYMENT_SUCCESS_TOPIC, PAYMENT_FAILED_TOPIC, PAYMENT_REFUND_SUCCESS_TOPIC,
} from './events/payment-events';

// Events - Shipping
export {
  ShippingOrderCreatedEvent, ShippingStatusUpdatedEvent,
  SHIPPING_ORDER_CREATED_TOPIC, SHIPPING_STATUS_UPDATED_TOPIC,
} from './events/shipping-events';

// Events - User
export { UserCreatedEvent, USER_CREATED_TOPIC } from './events/user-events';

// Events - Loyalty
export { LoyaltyPointsEarnedEvent, LOYALTY_POINTS_EARNED_TOPIC } from './events/loyalty-events';

// Events - All topics
export {
  INVENTORY_RESERVE_REQUEST_TOPIC, INVENTORY_RESERVE_REPLY_TOPIC,
  PROMOTION_VALIDATE_REQUEST_TOPIC, PROMOTION_VALIDATE_REPLY_TOPIC,
  DLQ_FAILED_MESSAGES_TOPIC,
} from './events/topics';
