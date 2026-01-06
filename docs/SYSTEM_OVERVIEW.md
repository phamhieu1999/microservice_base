# Tổng Quan Hệ Thống Microservices E-commerce

## 1. Tổng Quan Kiến Trúc

Hệ thống được xây dựng theo kiến trúc **Microservices** sử dụng:
- **API Gateway Pattern**: Tất cả requests từ client đi qua API Gateway
- **Event-Driven Architecture**: Sử dụng Kafka cho giao tiếp bất đồng bộ giữa các service
- **Database per Service**: Mỗi service có database riêng
- **Caching Strategy**: Redis cho caching và Elasticsearch cho search
- **Observability**: Prometheus, Grafana, Jaeger cho monitoring và tracing

## 2. Danh Sách Các Service

### 2.1. Core Services

| Service | Port | Database | Mô tả |
|---------|------|----------|-------|
| **api-gateway** | 3000 | - | Entry point, routing, authentication, rate limiting |
| **auth-service** | 3001 | PostgreSQL | Quản lý authentication, authorization, JWT tokens |
| **product-service** | 3002 | MongoDB | Quản lý sản phẩm, inventory, categories |
| **order-service** | 3003 | PostgreSQL | Quản lý đơn hàng, order lifecycle |
| **payment-service** | 3004 | PostgreSQL | Xử lý thanh toán, payment methods |
| **notification-service** | 3005 | MongoDB | Gửi notifications (email, SMS, push) |
| **cart-service** | 3006 | MongoDB | Quản lý giỏ hàng |
| **review-service** | 3007 | MongoDB | Quản lý đánh giá sản phẩm |
| **seller-service** | 3008 | PostgreSQL | Quản lý seller, shop information |
| **promotion-service** | 3009 | PostgreSQL | Quản lý vouchers, promotions |
| **shipping-service** | 3010 | MongoDB | Tính toán phí vận chuyển |
| **chat-service** | 3011 | MongoDB | Chat giữa buyer và seller |
| **search-service** | 3012 | MongoDB + Elasticsearch + Redis | Tìm kiếm sản phẩm với full-text search |
| **dlq-service** | 3013 | MongoDB | Dead Letter Queue - xử lý failed messages |
| **analytics-service** | 3014 | MongoDB + Redis | Phân tích dữ liệu, metrics aggregation |
| **loyalty-service** | 3015 | PostgreSQL | Quản lý điểm thưởng, loyalty program |
| **dispute-service** | 3016 | PostgreSQL | Xử lý khiếu nại, disputes |
| **settlement-service** | 3017 | PostgreSQL | Thanh toán cho seller, commission |
| **warehouse-service** | 3018 | ClickHouse | Data warehouse, reporting, analytics |

### 2.2. Infrastructure Services

| Service | Port | Mô tả |
|---------|------|-------|
| **Kafka** | 9092 | Message broker cho event-driven communication |
| **Zookeeper** | 2181 | Coordination service cho Kafka |
| **PostgreSQL** | 5432-5440 | Relational databases (multiple instances) |
| **MongoDB** | 27017 | Document database |
| **Redis** | 6379 | Caching và session storage |
| **Elasticsearch** | 9200 | Full-text search engine |
| **ClickHouse** | 8123 | OLAP database cho data warehouse |
| **Prometheus** | 9090 | Metrics collection |
| **Grafana** | 3030 | Visualization và dashboards |
| **Jaeger** | 16686 | Distributed tracing |

## 3. Phân Tích Giao Tiếp Giữa Các Service

### 3.1. Giao Tiếp Đồng Bộ (Synchronous) - HTTP/REST

#### API Gateway → Backend Services

API Gateway sử dụng **HTTP/REST** để giao tiếp với các backend services:

```
Client → API Gateway (3000) → Backend Services
```

**Các Proxy Modules trong API Gateway:**

1. **Auth Proxy** → `auth-service:3001`
   - `POST /auth/register` - Đăng ký user
   - `POST /auth/login` - Đăng nhập
   - `POST /auth/refresh` - Refresh token
   - `POST /auth/logout` - Đăng xuất

2. **Product Proxy** → `product-service:3002`
   - `POST /products` - Tạo sản phẩm
   - `GET /products` - Danh sách sản phẩm
   - `GET /products/:id` - Chi tiết sản phẩm
   - `POST /products/batch` - Lấy nhiều sản phẩm

3. **Order Proxy** → `order-service:3003`
   - `POST /orders` - Tạo đơn hàng
   - `GET /orders/:id` - Chi tiết đơn hàng

4. **Cart Proxy** → `cart-service:3006`
   - `GET /cart` - Lấy giỏ hàng
   - `POST /cart/items` - Thêm vào giỏ hàng
   - `DELETE /cart/items/:productId` - Xóa khỏi giỏ hàng

5. **Review Proxy** → `review-service:3007`
   - `POST /reviews` - Tạo review
   - `GET /products/:productId/reviews` - Lấy reviews

6. **Seller Proxy** → `seller-service:3008`
   - `POST /sellers/register` - Đăng ký seller
   - `GET /sellers/me` - Thông tin seller hiện tại
   - `GET /shops/:id` - Thông tin shop

7. **Search Proxy** → `search-service:3012`
   - `GET /search` - Tìm kiếm sản phẩm
   - `GET /search/category` - Tìm theo category
   - `GET /search/brand` - Tìm theo brand

8. **Chat Proxy** → `chat-service:3011`
   - `POST /conversations` - Tạo conversation
   - `GET /conversations` - Danh sách conversations
   - `POST /conversations/:id/messages` - Gửi message
   - `GET /conversations/:id/messages` - Lấy messages

9. **Notification Proxy** → `notification-service:3005`
   - `GET /notifications` - Lấy notifications
   - `GET /notifications/unread-count` - Số lượng chưa đọc
   - `POST /notifications/:id/read` - Đánh dấu đã đọc

10. **Loyalty Proxy** → `loyalty-service:3015`
    - `GET /loyalty/points` - Lấy điểm thưởng
    - `GET /loyalty/history` - Lịch sử điểm thưởng
    - `POST /loyalty/redeem` - Đổi điểm thưởng

11. **Warehouse Proxy** → `warehouse-service:3018`
    - `GET /warehouse/revenue/daily` - Doanh thu theo ngày
    - `GET /warehouse/sellers/top` - Top sellers
    - `GET /warehouse/products/top` - Top products

12. **Admin Proxy** → `dispute-service:3016`, `settlement-service:3017`
    - `GET /admin/disputes` - Danh sách disputes
    - `GET /admin/disputes/:id` - Chi tiết dispute
    - `GET /admin/settlements/seller/:sellerId/summary` - Tóm tắt settlement

#### Inter-Service Communication (Service-to-Service)

Một số service giao tiếp trực tiếp với nhau qua HTTP:

1. **Payment Service** → **Promotion Service**
   - `POST /vouchers/apply` - Áp dụng voucher khi thanh toán

2. **Loyalty Service** → **Promotion Service**
   - `POST /loyalty-vouchers/exchange` - Đổi điểm lấy voucher

3. **Order Service** → **Product Service** (qua API Gateway)
   - Lấy thông tin sản phẩm khi tạo đơn hàng

4. **Home Service** (API Gateway) → Multiple Services
   - `GET /home` - Aggregates data từ nhiều services:
     - Search Service (flash sale)
     - Analytics Service (top products)
     - Order Service (recent orders)

### 3.2. Giao Tiếp Bất Đồng Bộ (Asynchronous) - Kafka Events

Hệ thống sử dụng **Apache Kafka** cho event-driven communication. Các service publish/subscribe events để giao tiếp bất đồng bộ.

#### Kafka Topics và Events

##### 1. User Events

| Topic | Publisher | Consumers | Mô tả |
|-------|-----------|----------|-------|
| `user.created` | auth-service | notification-service, warehouse-service, analytics-service | User mới đăng ký |

##### 2. Product Events

| Topic | Publisher | Consumers | Mô tả |
|-------|-----------|----------|-------|
| `product.created` | product-service | search-service, warehouse-service, analytics-service | Sản phẩm mới được tạo |
| `product.updated` | product-service | search-service | Sản phẩm được cập nhật |
| `product.low-stock` | product-service | notification-service | Cảnh báo hàng sắp hết |

##### 3. Order Events

| Topic | Publisher | Consumers | Mô tả |
|-------|-----------|----------|-------|
| `order.created` | order-service | product-service, notification-service, warehouse-service, analytics-service, chat-service | Đơn hàng mới được tạo |
| `order.cancelled` | order-service | product-service | Đơn hàng bị hủy |

**Luồng xử lý:**
```
order-service (publish order.created)
  ↓
product-service (consume) → Reserve stock
notification-service (consume) → Send notification
warehouse-service (consume) → Update data warehouse
analytics-service (consume) → Aggregate metrics
chat-service (consume) → Create conversation
```

##### 4. Payment Events

| Topic | Publisher | Consumers | Mô tả |
|-------|-----------|----------|-------|
| `payment.success` | payment-service | order-service, notification-service, warehouse-service, analytics-service, loyalty-service, settlement-service | Thanh toán thành công |
| `payment.failed` | payment-service | order-service, notification-service | Thanh toán thất bại |

**Luồng xử lý:**
```
payment-service (publish payment.success)
  ↓
order-service (consume) → Update order status to PAID
notification-service (consume) → Send success notification
warehouse-service (consume) → Update revenue metrics
analytics-service (consume) → Aggregate revenue
loyalty-service (consume) → Award loyalty points
settlement-service (consume) → Calculate seller commission
```

##### 5. Settlement Events

| Topic | Publisher | Consumers | Mô tả |
|-------|-----------|----------|-------|
| `settlement.balance.updated` | settlement-service | analytics-service | Cập nhật balance của seller |
| `settlement.payout.requested` | settlement-service | analytics-service | Yêu cầu payout |

##### 6. Dispute Events

| Topic | Publisher | Consumers | Mô tả |
|-------|-----------|----------|-------|
| `dispute.opened` | dispute-service | notification-service | Khiếu nại mới |
| `dispute.escalated` | dispute-service | notification-service | Khiếu nại được escalate |
| `dispute.resolved` | dispute-service | notification-service | Khiếu nại được giải quyết |

### 3.3. Database Communication

Mỗi service có database riêng:

#### PostgreSQL Services
- **auth-service** → `postgres-auth:5432` (auth_db)
- **order-service** → `postgres-order:5432` (order_db)
- **payment-service** → `postgres-payment:5432` (payment_db)
- **seller-service** → `postgres-seller:5432` (seller_db)
- **promotion-service** → `postgres-promo:5432` (promo_db)
- **loyalty-service** → `postgres-loyalty:5432` (loyalty_db)
- **dispute-service** → `postgres-dispute:5432` (dispute_db)
- **settlement-service** → `postgres-settlement:5432` (settlement_db)

#### MongoDB Services
- **product-service** → `mongo:27017` (product_db)
- **cart-service** → `mongo:27017` (cart_db)
- **review-service** → `mongo:27017` (review_db)
- **chat-service** → `mongo:27017` (chat_db)
- **notification-service** → `mongo:27017` (notification_db)
- **search-service** → `mongo:27017` (search_db)
- **analytics-service** → `mongo:27017` (analytics_db)
- **dlq-service** → `mongo:27017` (dlq_db)
- **shipping-service** → `mongo:27017` (shipping_db)

#### ClickHouse
- **warehouse-service** → `clickhouse:8123` (warehouse_db)

### 3.4. Caching và Search

#### Redis
- **search-service**: Cache kết quả tìm kiếm
- **analytics-service**: Cache aggregated metrics
- **api-gateway**: Cache responses

#### Elasticsearch
- **search-service**: Full-text search cho sản phẩm
- Index: `products`
- Fields: name, description, category, brand

## 4. Luồng Dữ Liệu Chính

### 4.1. Luồng Tạo Đơn Hàng (Order Creation Flow)

```
1. Client → API Gateway
   POST /orders
   ↓
2. API Gateway → Order Service (HTTP)
   POST /orders
   ↓
3. Order Service:
   - Validate order
   - Create order (status: PENDING)
   - Publish event: order.created
   ↓
4. Kafka Event: order.created
   ↓
5. Multiple Consumers:
   ├─→ Product Service: Reserve stock
   ├─→ Notification Service: Send notification
   ├─→ Warehouse Service: Log order fact
   ├─→ Analytics Service: Aggregate metrics
   └─→ Chat Service: Create conversation
   ↓
6. Order Service → Payment Service (HTTP)
   Initiate payment
   ↓
7. Payment Service:
   - Process payment
   - Publish event: payment.success hoặc payment.failed
   ↓
8. Kafka Event: payment.success
   ↓
9. Multiple Consumers:
   ├─→ Order Service: Update status to PAID
   ├─→ Notification Service: Send success notification
   ├─→ Warehouse Service: Log payment fact
   ├─→ Analytics Service: Aggregate revenue
   ├─→ Loyalty Service: Award points
   └─→ Settlement Service: Calculate commission
```

### 4.2. Luồng Tìm Kiếm Sản Phẩm (Search Flow)

```
1. Client → API Gateway
   GET /search?q=keyword
   ↓
2. API Gateway → Search Service (HTTP)
   GET /search?q=keyword
   ↓
3. Search Service:
   - Check Redis cache
   - If cache miss:
     - Query Elasticsearch
     - Cache result in Redis
   - Return results
```

### 4.3. Luồng Tạo Sản Phẩm (Product Creation Flow)

```
1. Client → API Gateway
   POST /products
   ↓
2. API Gateway → Product Service (HTTP)
   POST /products
   ↓
3. Product Service:
   - Create product in MongoDB
   - Publish event: product.created
   ↓
4. Kafka Event: product.created
   ↓
5. Multiple Consumers:
   ├─→ Search Service: Index in Elasticsearch
   ├─→ Warehouse Service: Log product fact
   └─→ Analytics Service: Initialize product metrics
```

## 5. Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY (3000)                        │
│  - Authentication & Authorization                           │
│  - Rate Limiting                                             │
│  - Request Routing                                           │
│  - Response Caching                                          │
└──────┬──────────┬──────────┬──────────┬──────────┬─────────┘
       │          │          │          │          │
       │ HTTP     │ HTTP     │ HTTP     │ HTTP     │ HTTP
       ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Auth    │ │ Product  │ │  Order   │ │ Payment  │ │  Other   │
│ Service  │ │ Service  │ │ Service  │ │ Service  │ │ Services │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │           │            │            │            │
     │           │            │            │            │
     └───────────┴────────────┴────────────┴────────────┘
                           │
                           │ Kafka Events
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    KAFKA (9092)                             │
│  Topics:                                                     │
│  - user.created, user.updated                               │
│  - product.created, product.updated, product.low-stock      │
│  - order.created, order.cancelled                           │
│  - payment.success, payment.failed                          │
│  - settlement.balance.updated, settlement.payout.requested  │
│  - dispute.opened, dispute.escalated, dispute.resolved     │
└──────┬──────────┬──────────┬──────────┬──────────┬─────────┘
       │          │          │          │          │
       │ Subscribe│ Subscribe│ Subscribe│ Subscribe│ Subscribe
       ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Notification││  Search  │ │Analytics │ │ Warehouse│ │  Other   │
│  Service  │ │ Service  │ │ Service  │ │ Service  │ │ Consumers│
└───────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

## 6. Các Pattern và Best Practices

### 6.1. Patterns Được Sử Dụng

1. **API Gateway Pattern**: Tất cả requests đi qua API Gateway
2. **Event-Driven Architecture**: Kafka cho async communication
3. **Database per Service**: Mỗi service có DB riêng
4. **CQRS** (Command Query Responsibility Segregation): Warehouse service tách biệt read/write
5. **Saga Pattern**: Order → Payment → Settlement flow
6. **Circuit Breaker**: Payment service có circuit breaker
7. **Dead Letter Queue**: DLQ service xử lý failed messages
8. **Caching Strategy**: Redis cho hot data
9. **Search Pattern**: Elasticsearch cho full-text search

### 6.2. Observability

- **Metrics**: Prometheus + Grafana
- **Tracing**: Jaeger (distributed tracing)
- **Logging**: Structured logging với correlation IDs
- **Health Checks**: Mỗi service có `/health` endpoint

### 6.3. Security

- **JWT Authentication**: Auth service quản lý tokens
- **Rate Limiting**: API Gateway có throttling
- **CORS**: Configured trong API Gateway
- **Input Validation**: DTOs với class-validator

## 7. Scalability và Performance

### 7.1. Horizontal Scaling

- Tất cả services có thể scale horizontally
- Kafka hỗ trợ multiple partitions
- Database connection pooling được cấu hình

### 7.2. Caching Strategy

- **API Gateway**: Cache responses
- **Search Service**: Cache search results trong Redis
- **Analytics Service**: Cache aggregated metrics

### 7.3. Database Optimization

- Connection pooling
- Indexes trên các fields thường query
- Read replicas (có thể mở rộng)

## 8. Dependencies và Technologies

### Backend Framework
- **NestJS**: Tất cả services sử dụng NestJS
- **TypeScript**: Type-safe development

### Databases
- **PostgreSQL**: Relational data
- **MongoDB**: Document data
- **ClickHouse**: OLAP analytics
- **Redis**: Caching
- **Elasticsearch**: Full-text search

### Message Broker
- **Apache Kafka**: Event streaming

### Monitoring
- **Prometheus**: Metrics
- **Grafana**: Visualization
- **Jaeger**: Tracing

## 9. Kết Luận

Hệ thống được thiết kế với:
- ✅ **Separation of Concerns**: Mỗi service có trách nhiệm riêng
- ✅ **Loose Coupling**: Giao tiếp qua events và HTTP
- ✅ **High Availability**: Có thể scale và replicate
- ✅ **Observability**: Đầy đủ monitoring và tracing
- ✅ **Performance**: Caching và optimization
- ✅ **Reliability**: DLQ cho failed messages, retry logic

Hệ thống sẵn sàng cho production với khả năng scale và maintain cao.

