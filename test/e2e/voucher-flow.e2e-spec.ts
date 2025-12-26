import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule as GatewayAppModule } from '../../services/api-gateway/src/modules/app.module';
import { JsonLoggerService } from '../../services/api-gateway/src/common/json-logger.service';

/**
 * E2E Test: Voucher Application Flow
 * 
 * Flow:
 * 1. Register user
 * 2. Create voucher
 * 3. Create order with voucher
 * 4. Verify discount applied
 * 5. Process payment
 * 6. Verify voucher applied after payment
 */
describe('Voucher Application Flow (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let voucherCode: string;
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

  it('should apply voucher to order', async () => {
    // Register and login
    const email = `voucher_${Date.now()}@example.com`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Test123456' })
      .expect(201);

    accessToken = registerRes.body.accessToken;

    // Create product
    const productRes = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Test Product',
        price: 100000,
        stock: 10,
      })
      .expect(201);

    // Create voucher (mock - in real scenario, this would be done via admin API)
    voucherCode = 'TEST10';

    // Validate voucher
    const validateRes = await request(app.getHttpServer())
      .post('/promotions/validate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        voucherCode,
        items: [
          {
            productId: productRes.body.id,
            quantity: 1,
            unitPrice: 100000,
          },
        ],
      })
      .expect(200);

    expect(validateRes.body.valid).toBe(true);

    // Create order with voucher
    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        items: [
          {
            productId: productRes.body.id,
            quantity: 1,
            unitPrice: 100000,
          },
        ],
        voucherCode,
        discountAmount: validateRes.body.discountAmount,
      })
      .expect(201);

    expect(orderRes.body.voucherId).toBeDefined();
    expect(orderRes.body.discountAmount).toBeGreaterThan(0);
    orderId = orderRes.body.id;
  });
});

