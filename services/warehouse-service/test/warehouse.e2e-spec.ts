import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/modules/app.module';

describe('WarehouseController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/warehouse/revenue/daily (GET)', () => {
    it('should return daily revenue data', () => {
      return request(app.getHttpServer())
        .get('/api/warehouse/revenue/daily')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should accept query parameters', () => {
      return request(app.getHttpServer())
        .get('/api/warehouse/revenue/daily?startDate=2024-01-01&endDate=2024-01-31&sellerId=seller_1')
        .expect(200);
    });
  });

  describe('/warehouse/sellers/top (GET)', () => {
    it('should return top sellers data', () => {
      return request(app.getHttpServer())
        .get('/api/warehouse/sellers/top?limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/warehouse/products/top (GET)', () => {
    it('should return top products data', () => {
      return request(app.getHttpServer())
        .get('/api/warehouse/products/top?limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });
});

