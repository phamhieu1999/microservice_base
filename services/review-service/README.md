# Review Service

Service quản lý reviews/đánh giá sản phẩm.

## Features

- Tạo, cập nhật, xóa reviews
- Lấy danh sách reviews theo sản phẩm, user
- Thống kê reviews (tổng số, điểm trung bình, phân bố rating)
- Pagination, filtering, sorting
- Swagger API documentation

## API Endpoints

- `POST /reviews` - Tạo review mới
- `GET /reviews/:id` - Lấy review theo ID
- `PATCH /reviews/:id` - Cập nhật review
- `DELETE /reviews/:id` - Xóa review
- `GET /products/:productId/reviews` - Lấy danh sách reviews của sản phẩm
- `GET /products/:productId/reviews/stats` - Thống kê reviews của sản phẩm
- `GET /users/:userId/reviews` - Lấy danh sách reviews của user
- `GET /reviews` - Lấy tất cả reviews

## Setup

### Prerequisites

- Node.js >= 18
- MongoDB
- npm hoặc yarn

### Installation

```bash
npm install
```

### Environment Variables

Tạo file `.env` hoặc set các biến môi trường:

```env
PORT=3007
REVIEW_MONGO_URI=mongodb://localhost:27017/review_db
NODE_ENV=development
```

### Database Migration

Chạy migration để tạo indexes:

```bash
# Cách 1: Sử dụng script helper (tự động start MongoDB nếu cần)
./scripts/migrate.sh

# Cách 2: Chạy trực tiếp (cần MongoDB đang chạy)
npm run migrate
```

### Seed Data

Seed dữ liệu mẫu:

```bash
npm run seed
```

## Development

```bash
# Start development server
npm run start:dev

# Build
npm run build

# Start production
npm start
```

## Swagger Documentation

Sau khi start service, truy cập:

- Swagger UI: http://localhost:3007/api-docs
- Swagger JSON: http://localhost:3007/api-docs-json

## Database Indexes

Service tự động tạo các indexes sau:

- `idx_review_product_rating`: Compound index (productId, rating)
- `idx_review_user_created`: Index (userId, createdAt)
- `idx_review_product_created`: Index (productId, createdAt)
- `idx_review_rating`: Index (rating)

## Scripts

- `npm run start` - Start production server
- `npm run start:dev` - Start development server với watch mode
- `npm run build` - Build project
- `npm run test` - Run tests
- `npm run lint` - Run linter
- `npm run migrate` - Run database migration (tạo indexes)
- `npm run seed` - Seed dữ liệu mẫu

