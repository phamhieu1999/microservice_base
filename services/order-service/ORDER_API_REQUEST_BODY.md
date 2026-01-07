# Request Body mẫu cho API `/orders` trong Order Service

## POST /orders

### DTO Structure

**CreateOrderDto:**
```typescript
{
  items: OrderItemDto[];           // Required - Danh sách sản phẩm
  orderGroupId?: string;            // Optional - ID nhóm đơn (nếu gộp nhiều đơn)
  voucherId?: string;               // Optional - ID mã giảm giá
  discountAmount?: number;          // Optional - Số tiền giảm
  shippingFee?: number;             // Optional - Phí vận chuyển
}
```

**OrderItemDto:**
```typescript
{
  productId: string;                // Required - ID sản phẩm
  quantity: number;                  // Required - Số lượng (min: 1)
  unitPrice: number;                // Required - Giá đơn vị (min: 0)
  sellerId?: string;                // Optional - ID người bán
}
```

---

## Ví dụ Request Body

### 1. Đơn hàng đơn giản (1 sản phẩm)

```json
{
  "items": [
    {
      "productId": "prod-001",
      "quantity": 2,
      "unitPrice": 649500,
      "sellerId": "seller-001"
    }
  ],
  "shippingFee": 30000
}
```

**Tính toán:**
- Tổng tiền sản phẩm: 2 × 649,500 = 1,299,000 VNĐ
- Phí vận chuyển: 30,000 VNĐ
- **Tổng đơn hàng: 1,329,000 VNĐ**

---

### 2. Đơn hàng có voucher giảm giá

```json
{
  "items": [
    {
      "productId": "prod-001",
      "quantity": 2,
      "unitPrice": 649500,
      "sellerId": "seller-001"
    },
    {
      "productId": "prod-002",
      "quantity": 1,
      "unitPrice": 299000,
      "sellerId": "seller-001"
    }
  ],
  "voucherId": "VOUCHER-001",
  "discountAmount": 50000,
  "shippingFee": 30000
}
```

**Tính toán:**
- Tổng tiền sản phẩm: (2 × 649,500) + (1 × 299,000) = 1,598,000 VNĐ
- Giảm giá: 50,000 VNĐ
- Phí vận chuyển: 30,000 VNĐ
- **Tổng đơn hàng: 1,578,000 VNĐ**

---

### 3. Đơn hàng nhiều sản phẩm từ nhiều seller

```json
{
  "items": [
    {
      "productId": "prod-003",
      "quantity": 1,
      "unitPrice": 2499000,
      "sellerId": "seller-002"
    },
    {
      "productId": "prod-004",
      "quantity": 2,
      "unitPrice": 949500,
      "sellerId": "seller-002"
    },
    {
      "productId": "prod-005",
      "quantity": 3,
      "unitPrice": 1199000,
      "sellerId": "seller-001"
    }
  ],
  "orderGroupId": "GRP-2024-001",
  "shippingFee": 50000
}
```

**Tính toán:**
- Tổng tiền sản phẩm: (1 × 2,499,000) + (2 × 949,500) + (3 × 1,199,000) = 7,345,000 VNĐ
- Phí vận chuyển: 50,000 VNĐ
- **Tổng đơn hàng: 7,395,000 VNĐ**

---

### 4. Đơn hàng tối thiểu (chỉ có items bắt buộc)

```json
{
  "items": [
    {
      "productId": "prod-006",
      "quantity": 1,
      "unitPrice": 199000
    }
  ]
}
```

**Tính toán:**
- Tổng tiền sản phẩm: 1 × 199,000 = 199,000 VNĐ
- Phí vận chuyển: 0 VNĐ (mặc định)
- **Tổng đơn hàng: 199,000 VNĐ**

---

### 5. Đơn hàng với discount và shipping fee

```json
{
  "items": [
    {
      "productId": "prod-007",
      "quantity": 5,
      "unitPrice": 149000,
      "sellerId": "seller-003"
    }
  ],
  "discountAmount": 100000,
  "shippingFee": 40000
}
```

**Tính toán:**
- Tổng tiền sản phẩm: 5 × 149,000 = 745,000 VNĐ
- Giảm giá: 100,000 VNĐ
- Phí vận chuyển: 40,000 VNĐ
- **Tổng đơn hàng: 685,000 VNĐ**

---

## Validation Rules

### Items Array
- ✅ **Required**: Phải có ít nhất 1 item
- ✅ **Type**: Array of objects
- ✅ **Min length**: 1

### OrderItemDto
- ✅ **productId**: Required, string, không được rỗng
- ✅ **quantity**: Required, number, phải ≥ 1
- ✅ **unitPrice**: Required, number, phải ≥ 0
- ⚠️ **sellerId**: Optional, string

### Optional Fields
- ⚠️ **orderGroupId**: Optional, string (dùng khi gộp nhiều đơn)
- ⚠️ **voucherId**: Optional, string (ID voucher đã validate)
- ⚠️ **discountAmount**: Optional, number (số tiền giảm đã tính)
- ⚠️ **shippingFee**: Optional, number (phí vận chuyển đã tính)

---

## Response mẫu

### Success Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "2cece589-a7e4-4203-9955-6a5ab04eeacd",
  "status": "PENDING",
  "totalAmount": 1329000,
  "discountAmount": 0,
  "shippingFee": 30000,
  "orderGroupId": null,
  "voucherId": null,
  "items": [
    {
      "id": "item-001",
      "productId": "prod-001",
      "quantity": 2,
      "unitPrice": 649500,
      "sellerId": "seller-001"
    }
  ],
  "createdAt": "2024-01-06T10:00:00.000Z",
  "updatedAt": "2024-01-06T10:00:00.000Z"
}
```

### Error Response (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": [
    "items must be an array",
    "items should not be empty",
    "items[0].productId must be a string",
    "items[0].quantity must not be less than 1"
  ],
  "error": "Bad Request"
}
```

---

## Lưu ý

1. **User ID**: Order service tự động lấy `userId` từ:
   - `req.user.userId` (nếu có JWT guard)
   - `req.headers['x-user-id']` (nếu gọi trực tiếp)
   - `'mock-user'` (fallback nếu không có)

2. **Tính toán totalAmount**: Service tự tính từ `items` (quantity × unitPrice) + shippingFee - discountAmount

3. **Order Status**: Mặc định là `PENDING` khi tạo mới

4. **Kafka Event**: Sau khi tạo order thành công, service sẽ emit event `ORDER_CREATED` lên Kafka

5. **Testing**: Có thể test trực tiếp qua:
   - Swagger UI: `http://localhost:3003/api-docs`
   - cURL: `curl -X POST http://localhost:3003/orders -H "Content-Type: application/json" -d @request.json`

