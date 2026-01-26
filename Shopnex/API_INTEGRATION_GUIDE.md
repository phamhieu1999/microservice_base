# Hướng Dẫn Tích Hợp API Service vào Shopnex

Tài liệu này liệt kê tất cả các API service có sẵn trong hệ thống microservice_base và có thể tích hợp vào Shopnex frontend.

## 📊 Tổng Quan

Hiện tại Shopnex đã tích hợp:
- ✅ **Auth Service** - Đăng nhập, đăng ký, OAuth
- ✅ **Products Service** - Tìm kiếm sản phẩm
- ✅ **Cart Service** - Quản lý giỏ hàng

## 🎯 Các API Service Có Thể Tích Hợp

### 🔴 **MỨC ĐỘ ƯU TIÊN CAO** (Cần thiết cho e-commerce cơ bản)

#### 1. **Order Service** (Đơn hàng)
**Endpoint:** `/orders`

**Các API:**
- `POST /orders` - Tạo đơn hàng mới từ giỏ hàng
  - Body: `{ items, voucherCode?, shippingFee?, address? }`
  - JWT required
  - Throttle: 10 requests/minute

- `GET /orders/:id` - Lấy chi tiết đơn hàng
  - JWT required

**Tích hợp:**
- Trang checkout từ giỏ hàng
- Trang xem lịch sử đơn hàng
- Trang chi tiết đơn hàng

---

#### 2. **Payment Service** (Thanh toán)
**Endpoint:** `/payments`

**Các API:**
- `POST /payments` - Tạo payment request
  - Body: `{ orderId, amount, method, provider }`
  - Methods: `CARD`, `EWALLET`, `BANK_TRANSFER`, `COD`
  - Providers: `VNPAY`, `MOMO`, `STRIPE`, `MOCK`
  - JWT required

- `GET /payments/:id` - Lấy trạng thái payment
  - JWT required

- `POST /payments/:id/refund` - Hoàn tiền
  - Body: `{ amount, reason }`
  - JWT required

**Tích hợp:**
- Trang thanh toán
- Trang xem trạng thái thanh toán
- Xử lý webhook từ payment provider

---

#### 3. **Shipping Service** (Vận chuyển)
**Endpoint:** `/shipping`

**Các API:**
- `GET /shipping/methods` - Lấy danh sách phương thức vận chuyển (Public)
- `GET /shipping/methods/:id` - Chi tiết phương thức vận chuyển (Public)
- `POST /shipping/calculate` - Tính phí vận chuyển
  - Body: `{ address, items, methodId? }`
  - JWT required

- `GET /shipping/tracking/:orderId` - Theo dõi đơn hàng
  - JWT required

**Tích hợp:**
- Trang checkout - chọn phương thức vận chuyển
- Tính phí vận chuyển real-time
- Trang theo dõi đơn hàng

---

#### 4. **Review Service** (Đánh giá sản phẩm)
**Endpoint:** `/reviews` và `/products/:productId/reviews`

**Các API:**
- `GET /products/:productId/reviews` - Danh sách reviews của sản phẩm (Public)
  - Query: `page?, limit?, rating?, sortBy?, sortOrder?`

- `GET /products/:productId/reviews/stats` - Thống kê reviews (Public)
  - Trả về: tổng số reviews, điểm trung bình, phân bố rating

- `POST /reviews` - Tạo review mới
  - Body: `{ productId, rating (1-5), content? }`
  - JWT required

- `PATCH /reviews/:id` - Cập nhật review
  - Body: `{ rating?, content? }`
  - JWT required

- `DELETE /reviews/:id` - Xóa review
  - JWT required

**Tích hợp:**
- Trang chi tiết sản phẩm - hiển thị reviews
- Form đánh giá sản phẩm sau khi mua
- Trang quản lý reviews của user

---

### 🟡 **MỨC ĐỘ ƯU TIÊN TRUNG BÌNH** (Tăng trải nghiệm người dùng)

#### 5. **Search Service** (Tìm kiếm nâng cao)
**Endpoint:** `/search`

**Các API:**
- `GET /search?q=...` - Tìm kiếm theo từ khóa (Public)
  - Query: `q (required), limit?, skip?`
  - Throttle: 30 requests/minute

- `GET /search/category?category=...` - Tìm kiếm theo danh mục (Public)
  - Query: `category (required), limit?, skip?`

- `GET /search/brand?brand=...` - Tìm kiếm theo thương hiệu (Public)
  - Query: `brand (required), limit?, skip?`

**Tích hợp:**
- Trang tìm kiếm nâng cao
- Filter theo category, brand
- Autocomplete search suggestions

---

#### 6. **Promotion/Voucher Service** (Mã giảm giá)
**Endpoint:** `/vouchers`

**Các API:**
- `POST /vouchers/validate` - Validate voucher code
  - Body: `{ code, cartItems? }`
  - JWT required

- `POST /vouchers/apply` - Áp dụng voucher vào đơn hàng
  - Body: `{ voucherId }`
  - JWT required

**Tích hợp:**
- Trang checkout - nhập mã giảm giá
- Trang danh sách voucher khả dụng
- Validate voucher real-time

---

#### 7. **Home Feed Service** (Trang chủ)
**Endpoint:** `/home`

**Các API:**
- `GET /home` - Lấy dữ liệu trang chủ
  - Trả về: flash sale, top products, recent orders
  - JWT required (optional - có thể public)

**Tích hợp:**
- Trang chủ với flash sale
- Top sản phẩm bán chạy
- Đơn hàng gần đây (nếu đã đăng nhập)

---

#### 8. **Notification Service** (Thông báo)
**Endpoint:** `/notifications`

**Các API:**
- `GET /notifications` - Danh sách thông báo của user
  - JWT required

- `GET /notifications/unread-count` - Số lượng thông báo chưa đọc
  - JWT required

- `POST /notifications/:id/read` - Đánh dấu đã đọc
  - JWT required

**Tích hợp:**
- Badge thông báo trên header
- Trang danh sách thông báo
- Real-time notifications (có thể dùng WebSocket)

---

### 🟢 **MỨC ĐỘ ƯU TIÊN THẤP** (Tính năng nâng cao)

#### 9. **Loyalty Service** (Điểm tích lũy)
**Endpoint:** `/loyalty`

**Các API:**
- `GET /loyalty/points` - Lấy điểm tích lũy hiện tại
  - JWT required

- `GET /loyalty/history` - Lịch sử giao dịch điểm
  - Query: `limit?, skip?`
  - JWT required

- `POST /loyalty/redeem` - Đổi điểm
  - Body: `{ points, voucherId?, description? }`
  - JWT required

- `POST /loyalty/referral` - Tạo mã giới thiệu
  - JWT required

**Tích hợp:**
- Trang điểm tích lũy
- Đổi điểm lấy voucher
- Chương trình giới thiệu

---

#### 10. **Analytics Service** (Phân tích - chủ yếu cho Admin/Seller)
**Endpoint:** `/analytics`

**Các API:**
- `GET /analytics/products/top` - Top sản phẩm bán chạy
  - Query: `limit?, sortBy? (sales|revenue)`
  - JWT required

- `GET /analytics/products/:productId` - Metrics của sản phẩm
  - JWT required

- `GET /analytics/revenue` - Phân tích doanh thu
  - Query: `startDate, endDate, period? (daily|weekly|monthly)`
  - JWT required

- `GET /analytics/users/dau` - Daily Active Users
  - Query: `date (YYYY-MM-DD)`
  - JWT required

**Tích hợp:**
- Dashboard cho seller
- Thống kê sản phẩm
- Báo cáo doanh thu

---

#### 11. **Chat Service** (Tin nhắn)
**Endpoint:** `/conversations` và `/conversations/:id/messages`

**Các API:**
- `POST /conversations` - Tạo cuộc hội thoại mới (buyer-seller)
  - JWT required

- `GET /conversations` - Danh sách cuộc hội thoại
  - JWT required

- `POST /conversations/:id/messages` - Gửi tin nhắn
  - JWT required

- `GET /conversations/:id/messages` - Danh sách tin nhắn
  - JWT required

**Tích hợp:**
- Chat với seller
- Trang tin nhắn
- Real-time chat (WebSocket)

---

#### 12. **Dispute Service** (Khiếu nại)
**Endpoint:** `/disputes`

**Các API:**
- `POST /disputes` - Tạo khiếu nại
  - Body: `{ orderId, reason, description }`
  - JWT required

- `GET /disputes` - Danh sách khiếu nại của user
  - JWT required

- `GET /disputes/:id` - Chi tiết khiếu nại
  - JWT required

**Tích hợp:**
- Trang khiếu nại đơn hàng
- Theo dõi trạng thái khiếu nại

---

## 📝 Ghi Chú Khi Tích Hợp

### 1. **Authentication**
- Hầu hết API cần JWT token
- Token được lưu trong `localStorage` (key: `shopnex.auth.tokens`)
- Axios interceptor tự động gắn token và refresh khi gặp 401

### 2. **Error Handling**
- Xử lý lỗi 401 (Unauthorized) - tự refresh token
- Xử lý lỗi 503 (Service unavailable) - hiển thị thông báo
- Xử lý lỗi 400 (Bad request) - hiển thị validation errors

### 3. **Rate Limiting**
- Một số API có throttle (ví dụ: Order - 10 req/min, Search - 30 req/min)
- Cần xử lý 429 (Too Many Requests)

### 4. **Public vs Protected**
- API có `@Public()` decorator không cần JWT
- API không có decorator cần JWT

### 5. **Pagination**
- Nhiều API hỗ trợ `page`, `limit`, `skip`
- Cần implement pagination UI

## 🚀 Kế Hoạch Tích Hợp Đề Xuất

### Phase 1: Core E-commerce (Ưu tiên cao)
1. ✅ Auth Service (Đã tích hợp)
2. ✅ Products Service (Đã tích hợp)
3. ✅ Cart Service (Đã tích hợp)
4. 🔄 Order Service
5. 🔄 Payment Service
6. 🔄 Shipping Service
7. 🔄 Review Service

### Phase 2: Enhanced UX (Ưu tiên trung bình)
8. 🔄 Search Service (nâng cao)
9. 🔄 Promotion/Voucher Service
10. 🔄 Home Feed Service
11. 🔄 Notification Service

### Phase 3: Advanced Features (Ưu tiên thấp)
12. 🔄 Loyalty Service
13. 🔄 Analytics Service (cho seller)
14. 🔄 Chat Service
15. 🔄 Dispute Service

## 📚 Tài Liệu Tham Khảo

- Swagger UI: `http://localhost:3000/api` (khi chạy api-gateway)
- API Gateway: `services/api-gateway/src/modules/*-proxy/*.controller.ts`
- Frontend API Client: `Shopnex/src/lib/api.ts`

