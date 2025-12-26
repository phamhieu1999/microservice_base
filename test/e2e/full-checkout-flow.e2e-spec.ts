import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule as GatewayAppModule } from '../../services/api-gateway/src/modules/app.module';
import { JsonLoggerService } from '../../services/api-gateway/src/common/json-logger.service';

/**
 * E2E Test: Full Checkout Flow
 * 
 * Flow:
 * 1. Register user
 * 2. Login
 * 3. Create product (as seller)
 * 4. Add to cart
 * 5. Create order
 * 6. Process payment
 * 7. Verify order status
 * 
 * Note: This test requires all services to be running
 * Run with: docker-compose up -d
 */
describe('Full Checkout Flow (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;
  let productId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GatewayAppModule],
    }).compile();

    app = moduleFixture.createNestApplication({
      logger: new JsonLoggerService('e2e-test'),
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. User Registration & Login', () => {
    it('should register a new user', async () => {
      const email = `test_${Date.now()}@example.com`;
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'Test123456',
        })
        .expect(201);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(email);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();

      accessToken = response.body.accessToken;
      userId = response.body.user.id;
    });

    it('should login with registered user', async () => {
      const email = `login_${Date.now()}@example.com`;
      const password = 'Test123456';

      // Register first
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password })
        .expect(201);

      // Login
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      accessToken = response.body.accessToken;
    });
  });

  describe('2. Product Creation', () => {
    it('should create a product', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Product',
          description: 'Test product description',
          price: 100000,
          stock: 10,
          category: 'Electronics',
          brand: 'Test Brand',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('Test Product');
      productId = response.body.id;
    });
  });

  describe('3. Cart Management', () => {
    it('should add product to cart', async () => {
      const response = await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productId,
          quantity: 2,
          price: 100000,
        })
        .expect(201);

      expect(response.body.items).toBeDefined();
      expect(response.body.items.length).toBeGreaterThan(0);
    });
  });

  describe('4. Order Creation', () => {
    it('should create an order', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          items: [
            {
              productId,
              quantity: 2,
              unitPrice: 100000,
            },
          ],
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.status).toBe('PENDING');
      expect(response.body.totalAmount).toBe(200000);
      orderId = response.body.id;
    });
  });

  describe('5. Payment Processing', () => {
    it('should process payment for order', async () => {
      // Note: Payment processing is async via Kafka
      // In real scenario, we would wait for payment.success event
      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          orderId,
          amount: 200000,
          provider: 'MOCK',
        })
        .expect(201);

      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.orderId).toBe(orderId);
    });
  });

  describe('6. Order Status Verification', () => {
    it('should get order details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(orderId);
      expect(response.body.items).toBeDefined();
    });
  });
});

