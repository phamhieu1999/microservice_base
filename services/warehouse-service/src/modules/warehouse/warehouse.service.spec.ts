import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseService } from './warehouse.service';
import { ClickHouseService } from '../../database/clickhouse.service';

describe('WarehouseService', () => {
  let service: WarehouseService;
  let clickhouseService: ClickHouseService;

  const mockClickHouseClient = {
    insert: jest.fn(),
    query: jest.fn(),
    ping: jest.fn(),
    close: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehouseService,
        {
          provide: ClickHouseService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockClickHouseClient),
            isClientReady: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<WarehouseService>(WarehouseService);
    clickhouseService = module.get<ClickHouseService>(ClickHouseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('insertOrderFact', () => {
    it('should add order to buffer', async () => {
      const orderData = {
        orderId: 'order_1',
        userId: 'user_1',
        sellerId: 'seller_1',
        productId: 'product_1',
        totalAmount: 100.50,
        status: 'CONFIRMED',
        orderDate: new Date(),
      };

      await service.insertOrderFact(orderData);

      // Should not insert immediately if buffer is not full
      expect(mockClickHouseClient.insert).not.toHaveBeenCalled();
    });

    it('should flush buffer when batch size is reached', async () => {
      mockClickHouseClient.insert.mockResolvedValue(undefined);

      // Fill buffer to batch size
      for (let i = 0; i < 100; i++) {
        await service.insertOrderFact({
          orderId: `order_${i}`,
          userId: 'user_1',
          totalAmount: 100,
          status: 'CONFIRMED',
          orderDate: new Date(),
        });
      }

      // Should have flushed
      expect(mockClickHouseClient.insert).toHaveBeenCalled();
    });
  });

  describe('insertPaymentFact', () => {
    it('should add payment to buffer', async () => {
      const paymentData = {
        paymentId: 'payment_1',
        orderId: 'order_1',
        userId: 'user_1',
        sellerId: 'seller_1',
        amount: 100.50,
        paymentMethod: 'CREDIT_CARD',
        provider: 'Stripe',
        status: 'SUCCESS',
        paymentDate: new Date(),
      };

      await service.insertPaymentFact(paymentData);

      // Should not insert immediately if buffer is not full
      expect(mockClickHouseClient.insert).not.toHaveBeenCalled();
    });
  });

  describe('getDailyRevenue', () => {
    it('should query daily revenue', async () => {
      const mockResult = {
        json: jest.fn().mockResolvedValue([
          { revenue_date: '2024-01-01', total_revenue: 1000, order_count: 10 },
        ]),
      };
      mockClickHouseClient.query.mockResolvedValue(mockResult);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const result = await service.getDailyRevenue(startDate, endDate);

      expect(mockClickHouseClient.query).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getTopSellers', () => {
    it('should query top sellers', async () => {
      const mockResult = {
        json: jest.fn().mockResolvedValue([
          { seller_id: 'seller_1', total_revenue: 5000, order_count: 50 },
        ]),
      };
      mockClickHouseClient.query.mockResolvedValue(mockResult);

      const result = await service.getTopSellers(10);

      expect(mockClickHouseClient.query).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getTopProducts', () => {
    it('should query top products', async () => {
      const mockResult = {
        json: jest.fn().mockResolvedValue([
          { product_id: 'product_1', total_revenue: 3000, order_count: 30 },
        ]),
      };
      mockClickHouseClient.query.mockResolvedValue(mockResult);

      const result = await service.getTopProducts(10);

      expect(mockClickHouseClient.query).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});

