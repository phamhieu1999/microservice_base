import { Test, TestingModule } from '@nestjs/testing';
import { OrderEventsConsumer } from '../src/kafka/order-events.consumer';
import { ProcessOrderCreatedUseCase } from '../src/application/payment/use-cases/process-order-created.usecase';

describe('OrderEventsConsumer', () => {
  let consumer: OrderEventsConsumer;
  let useCase: jest.Mocked<ProcessOrderCreatedUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderEventsConsumer,
        {
          provide: ProcessOrderCreatedUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    consumer = module.get<OrderEventsConsumer>(OrderEventsConsumer);
    useCase = module.get(ProcessOrderCreatedUseCase);
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  // Note: Full Kafka consumer test requires mocking Kafka client
  // This is a skeleton test structure
});

