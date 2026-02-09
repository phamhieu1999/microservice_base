# Sơ Đồ Giao Tiếp Giữa Các Service

## 1. Sơ Đồ Tổng Quan

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT APPLICATIONS                            │
│                    (Web, Mobile, Admin Dashboard)                        │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (Port 3000)                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Features:                                                       │   │
│  │ • Authentication & Authorization (JWT)                         │   │
│  │ • Rate Limiting (Throttler)                                     │   │
│  │ • Request Routing                                               │   │
│  │ • Response Caching (Redis)                                      │   │
│  │ • Compression                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────┬───────┬───────┬───────┬───────┬───────┬───────┬───────┬───────┘
        │       │       │       │       │       │       │       │
        │ HTTP  │ HTTP  │ HTTP  │ HTTP  │ HTTP  │ HTTP  │ HTTP  │ HTTP
        │       │       │       │       │       │       │       │
        ▼       ▼       ▼       ▼       ▼       ▼       ▼       ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  Auth   │ │ Product │ │  Order  │ │ Payment │ │  Cart   │ │  Other  │
│ Service │ │ Service │ │ Service │ │ Service │ │ Service │ │Services │
│  :3001  │ │  :3002  │ │  :3003  │ │  :3004  │ │  :3006  │ │         │
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └─────────┘ └─────────┘
     │          │            │            │
     │          │            │            │
     │          │            │            │
     └──────────┴────────────┴────────────┘
                    │
                    │ Kafka Events
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    KAFKA BROKER (Port 9092)                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Topics:                                                         │   │
│  │ • user.created, user.updated                                    │   │
│  │ • product.created, product.updated, product.low-stock          │   │
│  │ • order.created, order.cancelled                                │   │
│  │ • payment.success, payment.failed                               │   │
│  │ • settlement.balance.updated, settlement.payout.requested      │   │
│  │ • dispute.opened, dispute.escalated, dispute.resolved           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────┬───────┬───────┬───────┬───────┬───────┬───────┬───────┬───────┘
        │       │       │       │       │       │       │       │
        │       │       │       │       │       │       │       │
        ▼       ▼       ▼       ▼       ▼       ▼       ▼       ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Notification│ Search  │Analytics │ Warehouse │ Loyalty  │ Settlement│
│  Service  │ Service  │ Service  │ Service   │ Service  │ Service   │
│  :3005   │  :3012   │  :3014   │  :3018    │  :3015   │  :3017    │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

## 2. Luồng Tạo Đơn Hàng Chi Tiết

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ 1. POST /orders
     ▼
┌─────────────────┐
│  API Gateway     │
│  - Auth check    │
│  - Rate limit    │
└────┬─────────────┘
     │
     │ 2. POST /orders (HTTP)
     ▼
┌─────────────────┐
│  Order Service  │
│  - Validate     │
│  - Create order │
│  - Status:      │
│    PENDING      │
└────┬────────────┘
     │
     │ 3. Emit: order.created
     ▼
┌─────────────────┐
│     KAFKA       │
│  Topic:         │
│  order.created  │
└────┬────────────┘
     │
     ├─────────────────┬─────────────────┬─────────────────┬──────────────┐
     │                 │                 │                 │              │
     ▼                 ▼                 ▼                 ▼              ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Product  │    │Notification│  │ Warehouse│    │Analytics │    │  Chat    │
│ Service  │    │  Service   │  │ Service  │    │ Service  │    │ Service  │
│          │    │            │  │          │    │          │    │          │
│ Reserve  │    │ Send       │  │ Log order│    │ Aggregate│    │ Create   │
│ stock    │    │ notification│ │ fact     │    │ metrics  │    │ conversation│
└──────────┘    └───────────┘    └──────────┘    └──────────┘    └──────────┘
     │
     │ 4. Initiate Payment (HTTP)
     ▼
┌─────────────────┐
│ Payment Service │
│ - Process       │
│ - Validate      │
│   voucher       │
└────┬────────────┘
     │
     │ 5. Emit: payment.success
     ▼
┌─────────────────┐
│     KAFKA       │
│  Topic:         │
│ payment.success │
└────┬────────────┘
     │
     ├─────────────────┬─────────────────┬─────────────────┬──────────────┐
     │                 │                 │                 │              │
     ▼                 ▼                 ▼                 ▼              ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Order   │    │Notification│  │ Warehouse│    │Analytics │    │ Loyalty  │
│ Service  │    │  Service   │  │ Service  │    │ Service  │    │ Service  │
│          │    │            │  │          │    │          │    │          │
│ Update   │    │ Send       │  │ Log      │    │ Aggregate│    │ Award    │
│ status   │    │ success    │  │ payment  │    │ revenue  │    │ points   │
│ to PAID  │    │ notification│ │ fact     │    │          │    │          │
└──────────┘    └───────────┘    └────┬─────┘    └──────────┘    └──────────┘
                                      │
                                      │ 6. Emit: settlement.balance.updated
                                      ▼
                              ┌──────────────┐
                              │ Settlement   │
                              │ Service      │
                              │              │
                              │ Calculate    │
                              │ commission   │
                              └──────┬───────┘
                                     │
                                     │ 7. Emit: settlement.balance.updated
                                     ▼
                              ┌──────────────┐
                              │   KAFKA      │
                              │   Topic:     │
                              │ settlement.  │
                              │ balance.     │
                              │ updated      │
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │  Analytics   │
                              │  Service     │
                              │              │
                              │ Update       │
                              │ seller       │
                              │ metrics      │
                              └──────────────┘
```

## 3. Luồng Tìm Kiếm Sản Phẩm

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ 1. GET /search?q=keyword
     ▼
┌─────────────────┐
│  API Gateway     │
│  - Check cache   │
└────┬─────────────┘
     │
     │ 2. GET /search?q=keyword (HTTP)
     ▼
┌─────────────────┐
│  Search Service  │
│                  │
│  3. Check Redis  │
│     cache        │
└────┬─────────────┘
     │
     │ Cache Hit?
     ├─── YES ────► Return cached results
     │
     │ NO
     ▼
┌─────────────────┐
│  Search Service  │
│                  │
│  4. Query        │
│     Elasticsearch│
└────┬─────────────┘
     │
     │ 5. Cache results in Redis
     │
     ▼
┌─────────────────┐
│  Return results │
└─────────────────┘
```

## 4. Luồng Tạo Sản Phẩm

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ 1. POST /products
     ▼
┌─────────────────┐
│  API Gateway     │
│  - Auth check    │
│  - Validate      │
└────┬─────────────┘
     │
     │ 2. POST /products (HTTP)
     ▼
┌─────────────────┐
│ Product Service │
│                  │
│ 3. Create in     │
│    MongoDB       │
└────┬─────────────┘
     │
     │ 4. Emit: product.created
     ▼
┌─────────────────┐
│     KAFKA       │
│  Topic:         │
│ product.created │
└────┬────────────┘
     │
     ├─────────────────┬─────────────────┬─────────────────┐
     │                 │                 │                 │
     ▼                 ▼                 ▼                 ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Search  │    │ Warehouse│   │Analytics │    │Notification│
│ Service  │    │ Service  │   │ Service  │    │  Service   │
│          │    │          │   │          │    │            │
│ Index in │    │ Log      │   │ Initialize│   │ (if low    │
│ Elastic- │    │ product  │   │ product   │   │  stock)    │
│ search   │    │ fact     │   │ metrics  │   │            │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

## 5. Giao Tiếp HTTP Trực Tiếp Giữa Services

```
┌─────────────────┐
│ Payment Service  │
└────┬─────────────┘
     │
     │ HTTP POST /vouchers/apply
     ▼
┌─────────────────┐
│ Promotion Service│
│                  │
│ Validate & Apply │
│ voucher          │
└─────────────────┘

┌─────────────────┐
│ Loyalty Service │
└────┬─────────────┘
     │
     │ HTTP POST /loyalty-vouchers/exchange
     ▼
┌─────────────────┐
│ Promotion Service│
│                  │
│ Exchange points  │
│ for voucher      │
└─────────────────┘
```

## 6. Database Connections

```
┌─────────────────────────────────────────────────────────────┐
│                    POSTGRESQL INSTANCES                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ postgres-auth│  │postgres-order│  │postgres-payment│    │
│  │   :5433      │  │   :5434      │  │   :5435       │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘     │
│         │                 │                 │               │
│         │                 │                 │               │
│         ▼                 ▼                 ▼               │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐         │
│  │  Auth    │      │  Order   │      │ Payment  │         │
│  │ Service  │      │ Service  │      │ Service  │         │
│  └──────────┘      └──────────┘      └──────────┘         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │postgres-seller│  │postgres-promo│  │postgres-loyalty│   │
│  │   :5436       │  │   :5437      │  │   :5438       │    │
│  └──────┬────────┘  └──────┬───────┘  └──────┬────────┘     │
│         │                 │                 │               │
│         ▼                 ▼                 ▼               │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐         │
│  │  Seller  │      │ Promotion│      │ Loyalty  │         │
│  │ Service  │      │ Service  │      │ Service  │         │
│  └──────────┘      └──────────┘      └──────────┘         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      MONGODB (27017)                         │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Product  │  │   Cart   │  │  Review  │  │   Chat   │  │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │
│  │          │  │          │  │          │  │          │  │
│  │product_db│  │ cart_db  │  │review_db │  │ chat_db  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Notification│ │  Search  │  │Analytics │  │   DLQ    │  │
│  │  Service  │  │ Service  │  │ Service  │  │ Service  │  │
│  │          │  │          │  │          │  │          │  │
│  │notification│ │search_db │  │analytics │  │  dlq_db  │  │
│  │    _db   │  │          │  │   _db    │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    CLICKHOUSE (8123)                         │
│                                                              │
│  ┌──────────┐                                               │
│  │ Warehouse│                                               │
│  │ Service  │                                               │
│  │          │                                               │
│  │warehouse_│                                               │
│  │   db     │                                               │
│  └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      REDIS (6379)                            │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  Search  │  │Analytics │  │API Gateway│                  │
│  │ Service  │  │ Service  │  │          │                  │
│  │          │  │          │  │          │                  │
│  │ Cache    │  │ Cache    │  │ Cache    │                  │
│  │ search   │  │ metrics  │  │ responses│                  │
│  │ results  │  │          │  │          │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  ELASTICSEARCH (9200)                        │
│                                                              │
│  ┌──────────┐                                               │
│  │  Search  │                                               │
│  │ Service  │                                               │
│  │          │                                               │
│  │ Index:   │                                               │
│  │ products │                                               │
│  └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘
```

## 7. Event Flow Matrix

| Event | Publisher | Consumers | Purpose |
|-------|-----------|-----------|---------|
| `user.created` | auth-service | notification-service, warehouse-service, analytics-service | User registration |
| `product.created` | product-service | search-service, warehouse-service, analytics-service | New product |
| `product.updated` | product-service | search-service | Product update |
| `product.low-stock` | product-service | notification-service | Stock alert |
| `order.created` | order-service | product-service, notification-service, warehouse-service, analytics-service, chat-service | New order |
| `order.cancelled` | order-service | product-service | Order cancellation |
| `payment.success` | payment-service | order-service, notification-service, warehouse-service, analytics-service, loyalty-service, settlement-service | Payment success |
| `payment.failed` | payment-service | order-service, notification-service | Payment failure |
| `settlement.balance.updated` | settlement-service | analytics-service | Balance update |
| `settlement.payout.requested` | settlement-service | analytics-service | Payout request |
| `dispute.opened` | dispute-service | notification-service | New dispute |
| `dispute.escalated` | dispute-service | notification-service | Escalated dispute |
| `dispute.resolved` | dispute-service | notification-service | Resolved dispute |

## 8. Service Dependencies

### Direct HTTP Dependencies
- **Payment Service** → Promotion Service (voucher validation)
- **Loyalty Service** → Promotion Service (voucher exchange)
- **Order Service** → Product Service (via API Gateway, get product info)

### Kafka Dependencies
- **All services** → Kafka (publish/subscribe events)
- **DLQ Service** → Kafka (consume failed messages)

### Database Dependencies
- Each service → Its own database (PostgreSQL/MongoDB/ClickHouse)
- **Search Service** → Elasticsearch (full-text search)
- **Search Service, Analytics Service, API Gateway** → Redis (caching)

## 9. Communication Patterns Summary

### Synchronous (HTTP/REST)
- **Client ↔ API Gateway**: All client requests
- **API Gateway ↔ Backend Services**: Request routing
- **Payment Service ↔ Promotion Service**: Voucher validation
- **Loyalty Service ↔ Promotion Service**: Voucher exchange

### Asynchronous (Kafka Events)
- **Order lifecycle**: order.created → payment.success → settlement
- **Product lifecycle**: product.created → search indexing
- **User lifecycle**: user.created → notifications
- **Analytics**: All business events → metrics aggregation
- **Warehouse**: All business events → data warehouse

### Caching
- **Redis**: Hot data caching
- **API Gateway**: Response caching
- **Search Service**: Search result caching

### Search
- **Elasticsearch**: Full-text search index
- **MongoDB**: Search metadata storage

