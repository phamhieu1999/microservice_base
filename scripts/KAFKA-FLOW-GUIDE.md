# Hướng Dẫn Chạy Luồng Kafka Qua Các Service

## 📋 Tổng Quan

Hệ thống sử dụng Apache Kafka để giao tiếp bất đồng bộ giữa các microservices. Tài liệu này hướng dẫn cách test và monitor luồng Kafka.

## 🚀 Các Script Có Sẵn

### 1. `test-kafka-flow.sh` - Test Luồng Kafka

Script để test và kiểm tra luồng Kafka.

**Cách sử dụng:**
```bash
# Test toàn bộ luồng (mặc định)
./scripts/test-kafka-flow.sh

# Hoặc các lệnh riêng lẻ
./scripts/test-kafka-flow.sh check              # Kiểm tra Kafka đang chạy
./scripts/test-kafka-flow.sh list-topics         # Liệt kê topics
./scripts/test-kafka-flow.sh list-consumers     # Liệt kê consumer groups
./scripts/test-kafka-flow.sh send-events        # Gửi test events
./scripts/test-kafka-flow.sh monitor            # Monitor consumer lag
./scripts/test-kafka-flow.sh details            # Chi tiết topics
```

### 2. `monitor-kafka-flow.sh` - Monitor Real-time

Script để monitor real-time luồng Kafka.

**Cách sử dụng:**
```bash
# Dashboard real-time (mặc định)
./scripts/monitor-kafka-flow.sh dashboard

# Monitor một topic cụ thể
./scripts/monitor-kafka-flow.sh topic order.created 30

# Monitor tất cả topics
./scripts/monitor-kafka-flow.sh all 10

# Xem trạng thái consumer groups
./scripts/monitor-kafka-flow.sh consumers

# Xem offsets của topics
./scripts/monitor-kafka-flow.sh offsets
```

### 3. `run-kafka-flow.sh` - Chạy Toàn Bộ Luồng

Script tổng hợp để khởi động services và test luồng Kafka.

**Cách sử dụng:**
```bash
# Chạy toàn bộ: start infrastructure + services + test
./scripts/run-kafka-flow.sh all

# Hoặc từng bước
./scripts/run-kafka-flow.sh infrastructure  # Chỉ khởi động Kafka, DBs
./scripts/run-kafka-flow.sh consumers       # Khởi động consumer services
./scripts/run-kafka-flow.sh producers       # Khởi động producer services
./scripts/run-kafka-flow.sh test            # Test luồng Kafka
./scripts/run-kafka-flow.sh monitor         # Monitor real-time
./scripts/run-kafka-flow.sh status          # Xem trạng thái
```

## 📊 Các Kafka Topics

### User Events
- `user.created` - User mới đăng ký
  - **Publisher:** auth-service
  - **Consumers:** notification-service, warehouse-service, analytics-service

### Product Events
- `product.created` - Sản phẩm mới được tạo
  - **Publisher:** product-service
  - **Consumers:** search-service, warehouse-service, analytics-service

- `product.updated` - Sản phẩm được cập nhật
  - **Publisher:** product-service
  - **Consumers:** search-service

- `product.low-stock` - Cảnh báo hàng sắp hết
  - **Publisher:** product-service
  - **Consumers:** notification-service

### Order Events
- `order.created` - Đơn hàng mới được tạo
  - **Publisher:** order-service
  - **Consumers:** product-service, notification-service, warehouse-service, analytics-service, chat-service, payment-service

- `order.cancelled` - Đơn hàng bị hủy
  - **Publisher:** order-service
  - **Consumers:** product-service

### Payment Events
- `payment.success` - Thanh toán thành công
  - **Publisher:** payment-service
  - **Consumers:** order-service, notification-service, warehouse-service, analytics-service, loyalty-service, settlement-service

- `payment.failed` - Thanh toán thất bại
  - **Publisher:** payment-service
  - **Consumers:** order-service, notification-service

- `payment.refund.success` - Hoàn tiền thành công
  - **Publisher:** payment-service
  - **Consumers:** order-service

### Shipping Events
- `shipping.order.created` - Shipping order được tạo
  - **Publisher:** shipping-service
  - **Consumers:** (reserved)

- `shipping.order.status.updated` - Trạng thái vận chuyển thay đổi
  - **Publisher:** shipping-service
  - **Consumers:** order-service

### Settlement Events
- `settlement.balance.updated` - Cập nhật balance của seller
  - **Publisher:** settlement-service
  - **Consumers:** analytics-service, warehouse-service

- `settlement.payout.requested` - Yêu cầu payout
  - **Publisher:** settlement-service
  - **Consumers:** analytics-service

### Dispute Events
- `dispute.opened` - Khiếu nại mới
- `dispute.escalated` - Khiếu nại được escalate
- `dispute.resolved` - Khiếu nại được giải quyết
  - **Publisher:** dispute-service
  - **Consumers:** notification-service

### Loyalty Events
- `loyalty.points.earned` - Điểm thưởng được tích lũy
  - **Publisher:** loyalty-service
  - **Consumers:** warehouse-service

## 🔄 Luồng Xử Lý Chính

### Luồng Order → Payment → Settlement

```
1. order-service (publish order.created)
   ↓
2. product-service (consume) → Reserve stock
   notification-service (consume) → Send notification
   warehouse-service (consume) → Update data warehouse
   analytics-service (consume) → Aggregate metrics
   chat-service (consume) → Create conversation
   payment-service (consume) → Process payment
   ↓
3. payment-service (publish payment.success)
   ↓
4. order-service (consume) → Update order status to PAID
   notification-service (consume) → Send success notification
   warehouse-service (consume) → Update revenue metrics
   analytics-service (consume) → Aggregate revenue
   loyalty-service (consume) → Award loyalty points
   settlement-service (consume) → Calculate seller commission
   ↓
5. settlement-service (publish settlement.balance.updated)
   ↓
6. analytics-service (consume) → Update analytics
   warehouse-service (consume) → Update warehouse data
```

### Luồng Refund (Hoàn tiền)

```
1. Client gọi POST /payments/:id/refund
   ↓
2. payment-service xử lý refund qua provider
   → Cập nhật payment status (REFUNDED / PARTIALLY_REFUNDED)
   → Publish payment.refund.success (via outbox)
   ↓
3. order-service (consume payment.refund.success)
   → Cập nhật order status: REFUND_PENDING → REFUNDED / PARTIALLY_REFUNDED
```

### Luồng Shipping → Order (Đồng bộ trạng thái vận chuyển)

```
1. shipping-service cập nhật tracking status
   → Publish shipping.order.status.updated
   ↓
2. order-service (consume shipping.order.status.updated)
   → CONFIRMED  → order SHIPPED
   → DELIVERED  → order DELIVERED
   → RETURNED   → order RETURN_RECEIVED
```

## 🧪 Test Luồng Kafka

### Bước 1: Đảm bảo Kafka đang chạy
```bash
docker ps | grep kafka
```

### Bước 2: Kiểm tra topics
```bash
./scripts/test-kafka-flow.sh list-topics
```

### Bước 3: Gửi test events
```bash
./scripts/test-kafka-flow.sh send-events
```

### Bước 4: Khởi động consumer services (nếu chưa chạy)
```bash
cd deploy
docker compose up -d \
  notification-service \
  analytics-service \
  warehouse-service \
  search-service \
  order-service \
  payment-service \
  product-service \
  loyalty-service \
  settlement-service \
  chat-service
```

### Bước 5: Monitor consumer groups
```bash
./scripts/test-kafka-flow.sh monitor
```

### Bước 6: Xem logs của services
```bash
# Xem logs của một service
docker compose -f deploy/docker-compose.yml logs -f notification-service

# Xem logs của nhiều services
docker compose -f deploy/docker-compose.yml logs -f \
  notification-service \
  analytics-service \
  warehouse-service
```

## 📈 Monitor Real-time

### Dashboard
```bash
./scripts/monitor-kafka-flow.sh dashboard
```

### Monitor một topic cụ thể
```bash
./scripts/monitor-kafka-flow.sh topic order.created 60
```

### Xem consumer lag
```bash
./scripts/test-kafka-flow.sh monitor
```

## 🔍 Troubleshooting

### Kafka không kết nối được
```bash
# Kiểm tra Kafka container
docker ps | grep kafka

# Kiểm tra logs
docker logs kafka

# Restart Kafka
docker compose -f deploy/docker-compose.yml restart kafka
```

### Consumer không nhận messages
```bash
# Kiểm tra consumer groups
./scripts/test-kafka-flow.sh list-consumers

# Kiểm tra service logs
docker compose -f deploy/docker-compose.yml logs notification-service

# Kiểm tra service đang chạy
docker compose -f deploy/docker-compose.yml ps
```

### Topics không được tạo
```bash
# Topics sẽ được tạo tự động khi service gửi message đầu tiên
# Hoặc tạo thủ công:
docker exec kafka kafka-topics \
  --create \
  --bootstrap-server localhost:9092 \
  --topic order.created \
  --partitions 6 \
  --replication-factor 1
```

## 📝 Lưu Ý

1. **Topics tự động tạo:** Topics sẽ được tạo tự động khi service gửi message đầu tiên
2. **Consumer groups:** Mỗi service có consumer group riêng để track offset
3. **Message format:** Tất cả messages đều là JSON strings
4. **Retry mechanism:** Các service có retry logic để xử lý lỗi
5. **DLQ:** Failed messages được gửi vào `dlq.failed-messages` topic

## 🎯 Quick Start

```bash
# 1. Chạy toàn bộ luồng
./scripts/run-kafka-flow.sh all

# 2. Monitor real-time
./scripts/monitor-kafka-flow.sh dashboard

# 3. Test lại
./scripts/test-kafka-flow.sh full-test
```

## 📚 Tài Liệu Liên Quan

- `docs/SYSTEM_OVERVIEW.md` - Tổng quan hệ thống
- `docs/SERVICE_COMMUNICATION_DIAGRAM.md` - Sơ đồ giao tiếp giữa services
- `deploy/kafka/topics.yml` - Cấu hình topics

