# Promotion Service

Service quản lý vouchers và promotions cho hệ thống e-commerce.

## 🚀 Quick Start

### 1. Start Database

```bash
cd ../../deploy
docker compose up -d postgres-promo
```

### 2. Run Migrations

```bash
cd services/promotion-service
npm run migrate
```

### 3. Seed Data (Optional)

```bash
npm run seed
```

### 4. Start Service

```bash
# Development
npm run start:dev

# Production
npm run build
npm start
```

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (for database)

## 🔧 Configuration

### Environment Variables

Tạo file `.env` (hoặc copy từ `.env.example`):

```env
# Database Configuration
PROMO_DB_HOST=localhost        # postgres-promo when in Docker
PROMO_DB_PORT=5437             # 5432 when in Docker
PROMO_DB_USER=promo_user
PROMO_DB_PASSWORD=promo_password
PROMO_DB_NAME=promo_db

# Service Configuration
PORT=3009
NODE_ENV=development
```

### Docker Compose

Service đã được cấu hình trong `deploy/docker-compose.yml`:

- Database: `postgres-promo` (port 5437)
- Service: `promotion-service` (port 3009)

## 📊 Database

### Tables

- `vouchers` - Thông tin vouchers
- `voucher_usages` - Lịch sử sử dụng vouchers

### Migrations

```bash
# Run migrations
npm run migrate

# Generate new migration
npm run migration:generate src/migrations/YourMigrationName

# Revert last migration
npm run migration:revert
```

## 🧪 Testing

```bash
# Run tests
npm test

# Health check
curl http://localhost:3009/health

# Swagger docs
open http://localhost:3009/api-docs
```

## 📚 API Endpoints

### Vouchers

- `POST /vouchers/validate` - Validate voucher
- `POST /vouchers/apply` - Apply voucher
- `GET /vouchers/:code` - Get voucher by code

### Loyalty

- `POST /loyalty-vouchers/exchange` - Exchange loyalty points for voucher

## 🔍 Monitoring

- Health: `http://localhost:3009/health`
- Metrics: `http://localhost:3009/metrics`
- Swagger: `http://localhost:3009/api-docs`

## 🛠️ Development

### Project Structure

```
promotion-service/
├── src/
│   ├── database/
│   │   ├── entities/        # TypeORM entities
│   │   └── migrations/      # Database migrations
│   ├── modules/
│   │   └── promotion/      # Promotion module
│   ├── common/             # Shared utilities
│   ├── seed/               # Seed data scripts
│   └── main.ts             # Application entry
├── ormconfig.ts            # TypeORM configuration
├── .env                    # Environment variables
└── package.json
```

### Scripts

- `npm run start:dev` - Start in development mode
- `npm run build` - Build for production
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed sample data
- `npm test` - Run tests
- `npm run lint` - Lint code

## 🐛 Troubleshooting

### Database Connection Issues

1. Check if database is running:
   ```bash
   docker compose ps postgres-promo
   ```

2. Verify connection:
   ```bash
   psql -h localhost -p 5437 -U promo_user -d promo_db
   ```

3. Check environment variables in `.env`

### Migration Issues

1. Ensure database is accessible
2. Check `.env` file has correct credentials
3. Verify migrations are in `src/migrations/` directory

## 📝 Notes

- Database uses UUID for primary keys
- Vouchers support multiple scopes: GLOBAL, SHOP, PRODUCT
- Voucher types: DISCOUNT, FREESHIP, LOYALTY_EXCHANGE
- Service supports running without database (SKIP_DB=true) for testing

