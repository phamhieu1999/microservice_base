## Demo E-commerce Microservices (NestJS, Kafka, PostgreSQL, MongoDB)

Dự án minh hoạ kiến trúc microservice cho hệ thống thương mại điện tử:

- **Ngôn ngữ & Framework**: Node.js, NestJS
- **Database**: PostgreSQL (giao dịch), MongoDB (dữ liệu linh hoạt)
- **Messaging**: Kafka (event-driven, async)
- **Gateway**: API Gateway (NestJS)
- **Bảo mật**: JWT, role-based (USER / ADMIN)
- **Observability**: logging, healthcheck, metrics cơ bản
- **Container hóa**: Docker, docker-compose

Cấu trúc chính:

- `services/` – mỗi microservice độc lập (Auth, User, Product, Order, Payment, Notification, Api Gateway)
- `deploy/` – docker-compose, config hạ tầng (Kafka, PostgreSQL, MongoDB)
- `shared/` – kiểu dùng chung (event payload, constant topic), không chia sẻ database.

Chi tiết kiến trúc, flow, và thiết kế được mô tả trong phần trả lời của assistant.


