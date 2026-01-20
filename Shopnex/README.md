# Shopnex (Frontend)

Frontend React + Redux Toolkit + Tailwind, tích hợp API của `microservice_base` thông qua `api-gateway`.

## Chạy dự án

### 1) Cấu hình môi trường

- Copy `env.example` thành `.env` và chỉnh `VITE_API_BASE_URL`:
  - Chạy trực tiếp `api-gateway` (docker-compose expose): `http://localhost:3000`
  - Chạy qua nginx load balancer: `http://localhost`

### 2) Cài và chạy

```bash
cd Shopnex
npm install
npm run dev
```

## Các API đang dùng

- **Auth**
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
- **Products**
  - `GET /products?q=...` (public)
- **Cart**
  - `GET /cart` (JWT)
  - `POST /cart/items` (JWT)
  - `DELETE /cart/items/:productId` (JWT)

## Ghi chú

- Token được lưu ở `localStorage` (key: `shopnex.auth.tokens`). Axios interceptor sẽ tự gắn `Authorization` và tự refresh token khi gặp `401`.
