import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule as GatewayAppModule } from '../../services/api-gateway/src/modules/app.module';
import { JsonLoggerService } from '../../services/api-gateway/src/common/json-logger.service';

/**
 * E2E Test: Multi-Seller Order Grouping
 * 
 * Flow:
 * 1. Register user
 * 2. Create products from different sellers
 * 3. Create order group with multiple orders
 * 4. Verify order grouping
 */
describe('Multi-Seller Order Grouping (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let orderGroupId: string;

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

  it('should create order group with multiple sellers', async () => {
    // Register and login
    const email = `multiseller_${Date.now()}@example.com`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Test123456' })
      .expect(201);

    accessToken = registerRes.body.accessToken;

    // Create products from different sellers (mock seller IDs)
    const seller1Product = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Product Seller 1',
        price: 100000,
        stock: 10,
        sellerId: 'seller-1',
      })
      .expect(201);

    const seller2Product = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Product Seller 2',
        price: 200000,
        stock: 5,
        sellerId: 'seller-2',
      })
      .expect(201);

    // Create order group
    orderGroupId = `group-${Date.now()}`;
    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        orderGroupId,
        items: [
          {
            productId: seller1Product.body.id,
            quantity: 1,
            unitPrice: 100000,
            sellerId: 'seller-1',
          },
          {
            productId: seller2Product.body.id,
            quantity: 1,
            unitPrice: 200000,
            sellerId: 'seller-2',
          },
        ],
      })
      .expect(201);

    expect(orderRes.body.orderGroupId).toBe(orderGroupId);
    expect(orderRes.body.totalAmount).toBe(300000);
  });
});

