import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderModule } from '../src/modules/order/order.module';
import { CreateOrderUseCase } from '../src/application/order/use-cases/create-order.usecase';
import { GetOrderUseCase } from '../src/application/order/use-cases/get-order.usecase';
import { CancelOrderUseCase } from '../src/application/order/use-cases/cancel-order.usecase';
import { KafkaService } from '../src/kafka/kafka.service';
import { KafkaModule } from '../src/kafka/kafka.module';
import { PaymentEventsConsumer } from '../src/kafka/payment-events.consumer';
import { MarkPaidUseCase } from '../src/application/order/use-cases/mark-paid.usecase';
import { MarkCancelledUseCase } from '../src/application/order/use-cases/mark-cancelled.usecase';
import { Order } from '../src/database/entities/order.entity';
import { OrderItem } from '../src/database/entities/order-item.entity';
import { OrderHistory } from '../src/database/entities/order-history.entity';

describe('Order Integration (e2e)', () => {
  let app: INestApplication;
  let createOrderUseCase: CreateOrderUseCase;
  let getOrderUseCase: GetOrderUseCase;
  let cancelOrderUseCase: CancelOrderUseCase;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Order, OrderItem, OrderHistory],
          synchronize: true,
        }),
        KafkaModule,
        OrderModule,
      ],
    })
      .overrideProvider(CreateOrderUseCase)
      .useValue({
        execute: jest.fn().mockResolvedValue({
          id: 'order-123',
          userId: 'user-123',
          status: 'PENDING',
          totalAmount: 200000,
          items: [],
        }),
      })
      .overrideProvider(GetOrderUseCase)
      .useValue({
        execute: jest.fn().mockResolvedValue({
          id: 'order-123',
          userId: 'user-123',
          status: 'PENDING',
          totalAmount: 200000,
        }),
      })
      .overrideProvider(CancelOrderUseCase)
      .useValue({
        execute: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(KafkaService)
      .useValue({
        emit: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(MarkPaidUseCase)
      .useValue({
        execute: jest.fn(),
      })
      .overrideProvider(MarkCancelledUseCase)
      .useValue({
        execute: jest.fn(),
      })
      .overrideProvider(PaymentEventsConsumer)
      .useValue({
        onModuleInit: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/orders (POST) - should create order', () => {
    return request(app.getHttpServer())
      .post('/orders')
      .send({
        items: [
          { productId: 'p1', quantity: 2, unitPrice: 100000, sellerId: 'seller-1' },
        ],
      })
      .expect(201)
      .expect((res: any) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.status).toBe('PENDING');
      });
  });

  it('/orders/:id (GET) - should get order', () => {
    return request(app.getHttpServer())
      .get('/orders/order-123')
      .expect(200)
      .expect((res: any) => {
        expect(res.body.id).toBe('order-123');
      });
  });

  it('/orders/:id/cancel (POST) - should cancel order', () => {
    return request(app.getHttpServer())
      .post('/orders/order-123/cancel')
      .send({ reason: 'User cancelled' })
      .expect(201)
      .expect((res: any) => {
        expect(res.body.success).toBe(true);
      });
  });
});

