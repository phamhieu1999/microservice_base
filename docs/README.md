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
- **[DESIGN_PATTERNS_ANALYSIS.md](./DESIGN_PATTERNS_ANALYSIS.md)** - Phân tích tổng quan và chi tiết các design patterns được tích hợp trong hệ thống
- **[DOCKER_OBJECTS_ANALYSIS.md](./DOCKER_OBJECTS_ANALYSIS.md)** - Phân tích chi tiết các Docker Objects: Images, Containers, Volumes, Networks, Health Checks, Dependencies
- **[DOCKER_COMPOSE_DOCKERFILE_LINKAGE.md](./DOCKER_COMPOSE_DOCKERFILE_LINKAGE.md)** - Giải thích chi tiết mối liên kết giữa docker-compose.yml và Dockerfile của các services, build context, path resolution
- **[DOCKER_VOLUMES_FLOW_ANALYSIS.md](./DOCKER_VOLUMES_FLOW_ANALYSIS.md)** - Phân tích luồng Docker volume và chức năng: data persistence flow, volume lifecycle, backup/restore, best practices
- **[VOLUME_PATHS_GUIDE.md](./VOLUME_PATHS_GUIDE.md)** - Hướng dẫn xem đường dẫn lưu trữ Docker volumes trên máy local, truy cập data, backup/restore
- **[CLICKHOUSE_ANALYSIS.md](./CLICKHOUSE_ANALYSIS.md)** - Phân tích hoạt động của ClickHouse trong hệ thống: Star Schema, ETL process, batch processing, query patterns, performance optimizations
- **[NGINX_HAPROXY_ANALYSIS.md](./NGINX_HAPROXY_ANALYSIS.md)** - Tổng hợp và so sánh Nginx vs HAProxy: cấu hình load balancing, health checks, session persistence, khi nào dùng cái nào, best practices
- **[NGINX_LOAD_BALANCING_MECHANISM.md](./NGINX_LOAD_BALANCING_MECHANISM.md)** - Phân tích chi tiết cơ chế load balancing của Nginx: thuật toán least_conn, health checks, failover, connection management, scaling behavior, monitoring và tối ưu hóa

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


