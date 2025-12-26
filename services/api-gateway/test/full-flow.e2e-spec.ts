/**
 * Test end-to-end full flow qua API Gateway:
 *   1) Đăng ký user
 *   2) Login lấy accessToken
 *   3) Tạo product
 *   4) Tạo order dùng product vừa tạo
 *   5) Poll trạng thái order đợi Kafka (Payment/Order) xử lý
 *
 * Yêu cầu: toàn bộ hạ tầng (Kafka + Postgres + Mongo + các service) đã chạy,
 * và API Gateway trỏ đúng tới các service qua biến môi trường.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/modules/app.module';
import { JsonLoggerService } from '../src/common/json-logger.service';

describe('Full flow e2e via API Gateway (Kafka saga)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication({
      logger: new JsonLoggerService('api-gateway-fullflow-test'),
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('register -> login -> create product -> create order -> wait for status', async () => {
    const server = app.getHttpServer();

    // 1) Đăng ký
    const email = `fullflow_${Date.now()}@example.com`;
    const password = 'StrongPass123!';

    const registerRes = await request(server)
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    expect(registerRes.body.accessToken).toBeDefined();

    // 2) Login (để chắc chắn flow login hoạt động)
    const loginRes = await request(server)
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const accessToken = loginRes.body.accessToken as string;
    expect(accessToken).toBeDefined();

    // 3) Tạo product
    const productRes = await request(server)
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `FullFlow Product ${Date.now()}`,
        price: 150,
        stock: 20,
      })
      .expect(201);

    const productId = productRes.body._id || productRes.body.id;
    expect(productId).toBeDefined();

    // 4) Tạo order (qua gateway -> order-service, publish order.created)
    const orderRes = await request(server)
      .post('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        items: [
          {
            productId,
            quantity: 2,
            unitPrice: 150,
          },
        ],
      })
      .expect(201);

    const orderId = orderRes.body.id;
    expect(orderId).toBeDefined();
    expect(orderRes.body.status).toBeDefined();

    // 5) Poll trạng thái order đợi Payment/Order update qua Kafka
    const maxAttempts = 10;
    let attempt = 0;
    let finalStatus: string | undefined;

    while (attempt < maxAttempts) {
      // eslint-disable-next-line no-await-in-loop
      const current = await request(server)
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      finalStatus = current.body.status;
      if (finalStatus && finalStatus !== 'PENDING') {
        break;
      }

      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 1000));
      attempt += 1;
    }

    // Payment mock có thể SUCCESS hoặc FAILED -> PAID hoặc CANCELLED đều hợp lệ
    expect(['PAID', 'CANCELLED']).toContain(finalStatus);
  });
}
);


