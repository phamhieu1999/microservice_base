import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/modules/app.module';
import { JsonLoggerService } from '../src/common/json-logger.service';

describe('ProductService e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication({
      logger: new JsonLoggerService('product-service-test'),
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

  it('/health (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('/products (GET) empty list initially', async () => {
    const res = await request(app.getHttpServer()).get('/products').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('/products (POST) create & GET by id', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/products')
      .send({
        name: `Test Product ${Date.now()}`,
        price: 100,
        stock: 10,
      })
      .expect(201);

    const productId = createRes.body._id || createRes.body.id;
    expect(productId).toBeDefined();

    const getRes = await request(app.getHttpServer()).get(`/products/${productId}`).expect(200);
    expect(getRes.body).toBeDefined();
    expect(getRes.body._id || getRes.body.id).toBe(productId);
  });
});


