# E2E Tests

## 📋 Overview

E2E tests cho full flows của hệ thống e-commerce microservice.

## 🚀 Setup

### Prerequisites
- Docker và Docker Compose
- Tất cả services đang chạy

### Start Services
```bash
cd deploy
docker-compose up -d
```

### Run Tests
```bash
# From project root
npm test -- test/e2e
```

## 📝 Test Files

### 1. Full Checkout Flow
**File:** `test/e2e/full-checkout-flow.e2e-spec.ts`

**Tests:**
- User registration & login
- Product creation
- Cart management
- Order creation
- Payment processing
- Order status verification

### 2. Multi-Seller Order Grouping
**File:** `test/e2e/multi-seller-order.e2e-spec.ts`

**Tests:**
- Order group creation với multiple sellers
- Order grouping verification

### 3. Voucher Application Flow
**File:** `test/e2e/voucher-flow.e2e-spec.ts`

**Tests:**
- Voucher validation
- Order creation với voucher
- Discount application
- Voucher application after payment

## ⚠️ Notes

- Tests require all services to be running
- Tests use real services (not mocked)
- Tests may take longer due to async operations (Kafka)
- Clean up test data after tests

## 🔧 Configuration

Tests connect to services via API Gateway at `http://localhost:3000`.

---

**Last Updated:** 2024

