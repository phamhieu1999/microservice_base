## Demo E-commerce Microservices (NestJS, Kafka, PostgreSQL, MongoDB)

Dự án minh hoạ kiến trúc microservice cho hệ thống thương mại điện tử:

- **Ngôn ngữ & Framework**: Node.js, NestJS
- **Database**: PostgreSQL (giao dịch), MongoDB (dữ liệu linh hoạt), ClickHouse (data warehouse)
- **Messaging**: Kafka (event-driven, async)
- **Gateway**: API Gateway (NestJS)
- **Bảo mật**: JWT, role-based (USER / ADMIN)
- **Observability**: logging, healthcheck, metrics (Prometheus, Grafana, Jaeger)
- **Container hóa**: Docker, docker-compose

Cấu trúc chính:

- `services/` – mỗi microservice độc lập (Auth, Product, Order, Payment, Notification, Api Gateway, ...)
- `deploy/` – docker-compose, config hạ tầng (Kafka, PostgreSQL, MongoDB, Redis, Elasticsearch)
- `shared/` – kiểu dùng chung (event payload, constant topic), không chia sẻ database.

## Tài Liệu

### 📚 Tài Liệu Kiến Trúc

- **[SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md)** - Tổng quan hệ thống, danh sách services, phân tích giao tiếp, luồng dữ liệu
- **[SERVICE_COMMUNICATION_DIAGRAM.md](./SERVICE_COMMUNICATION_DIAGRAM.md)** - Sơ đồ giao tiếp chi tiết giữa các service, luồng xử lý, event flow matrix

### 📁 Các Thư Mục Tài Liệu Khác

- `test/` - Tài liệu về testing
- `test/features/` - Tài liệu về features testing
- `test/load/` - Tài liệu về load testing

## Tổng Quan Nhanh

Hệ thống bao gồm **19 microservices** chính:

1. **API Gateway** - Entry point, routing, authentication
2. **Auth Service** - Authentication & authorization
3. **Product Service** - Quản lý sản phẩm
4. **Order Service** - Quản lý đơn hàng
5. **Payment Service** - Xử lý thanh toán
6. **Cart Service** - Quản lý giỏ hàng
7. **Review Service** - Đánh giá sản phẩm
8. **Seller Service** - Quản lý seller
9. **Promotion Service** - Vouchers, promotions
10. **Shipping Service** - Tính phí vận chuyển
11. **Chat Service** - Chat buyer-seller
12. **Search Service** - Tìm kiếm sản phẩm
13. **Notification Service** - Gửi notifications
14. **Analytics Service** - Phân tích dữ liệu
15. **Loyalty Service** - Điểm thưởng
16. **Dispute Service** - Xử lý khiếu nại
17. **Settlement Service** - Thanh toán seller
18. **Warehouse Service** - Data warehouse
19. **DLQ Service** - Dead Letter Queue

Xem chi tiết trong [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md).


