import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  const mockRevenueMetrics = [
    {
      date: new Date('2024-01-01'),
      revenue: 10000000,
      orderCount: 100,
      averageOrderValue: 100000,
      period: 'daily',
    },
    {
      date: new Date('2024-01-02'),
      revenue: 15000000,
      orderCount: 150,
      averageOrderValue: 100000,
      period: 'daily',
    },
  ];

  const mockProductMetrics = [
    {
      productId: 'prod_001',
      productName: 'Test Product',
      category: 'Electronics',
      sellerId: 'seller_001',
      salesCount: 100,
      revenue: 10000000,
      conversionRate: 5.5,
    },
  ];

  const mockUserMetrics = [
    {
      date: new Date('2024-01-01'),
      dailyActiveUsers: 1000,
      monthlyActiveUsers: 20000,
      newUsers: 50,
      retentionRate: 60.5,
    },
  ];

  const mockAnalyticsService = {
    getRevenueByPeriod: jest.fn(),
    getTotalRevenue: jest.fn(),
    getTopProducts: jest.fn(),
    getProductMetrics: jest.fn(),
    getProductsByCategory: jest.fn(),
    getProductsBySeller: jest.fn(),
    getUserMetrics: jest.fn(),
    getDAU: jest.fn(),
    getMAU: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRevenue', () => {
    it('should return revenue analytics', async () => {
      mockAnalyticsService.getRevenueByPeriod.mockResolvedValue(mockRevenueMetrics);

      const result = await controller.getRevenue('2024-01-01', '2024-01-02', 'daily');

      expect(service.getRevenueByPeriod).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        'daily',
      );
      expect(result).toEqual(mockRevenueMetrics);
    });
  });

  describe('getTotalRevenue', () => {
    it('should return total revenue summary', async () => {
      const mockTotalRevenue = {
        totalRevenue: 25000000,
        totalOrders: 250,
        averageOrderValue: 100000,
      };
      mockAnalyticsService.getTotalRevenue.mockResolvedValue(mockTotalRevenue);

      const result = await controller.getTotalRevenue('2024-01-01', '2024-01-02');

      expect(service.getTotalRevenue).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );
      expect(result).toEqual(mockTotalRevenue);
    });
  });

  describe('getTopProducts', () => {
    it('should return top products', async () => {
      mockAnalyticsService.getTopProducts.mockResolvedValue(mockProductMetrics);

      const result = await controller.getTopProducts('10', 'sales');

      expect(service.getTopProducts).toHaveBeenCalledWith(10, 'sales');
      expect(result).toEqual(mockProductMetrics);
    });

    it('should use default values when query params are not provided', async () => {
      mockAnalyticsService.getTopProducts.mockResolvedValue(mockProductMetrics);

      const result = await controller.getTopProducts(undefined, undefined);

      expect(service.getTopProducts).toHaveBeenCalledWith(10, 'sales');
      expect(result).toEqual(mockProductMetrics);
    });
  });

  describe('getProductMetrics', () => {
    it('should return product metrics', async () => {
      mockAnalyticsService.getProductMetrics.mockResolvedValue(mockProductMetrics[0]);

      const result = await controller.getProductMetrics('prod_001');

      expect(service.getProductMetrics).toHaveBeenCalledWith('prod_001');
      expect(result).toEqual(mockProductMetrics[0]);
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products by category', async () => {
      mockAnalyticsService.getProductsByCategory.mockResolvedValue(mockProductMetrics);

      const result = await controller.getProductsByCategory('Electronics');

      expect(service.getProductsByCategory).toHaveBeenCalledWith('Electronics');
      expect(result).toEqual(mockProductMetrics);
    });
  });

  describe('getProductsBySeller', () => {
    it('should return products by seller', async () => {
      const mockSellerProducts = {
        items: mockProductMetrics,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      mockAnalyticsService.getProductsBySeller.mockResolvedValue(mockSellerProducts);

      const result = await controller.getProductsBySeller('seller_001');

      expect(service.getProductsBySeller).toHaveBeenCalledWith('seller_001');
      expect(result).toEqual(mockSellerProducts);
    });
  });

  describe('getUserMetrics', () => {
    it('should return user analytics', async () => {
      mockAnalyticsService.getUserMetrics.mockResolvedValue(mockUserMetrics);

      const result = await controller.getUserMetrics('2024-01-01', '2024-01-02');

      expect(service.getUserMetrics).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );
      expect(result).toEqual(mockUserMetrics);
    });
  });

  describe('getDAU', () => {
    it('should return Daily Active Users', async () => {
      mockAnalyticsService.getDAU.mockResolvedValue(1000);

      const result = await controller.getDAU('2024-01-01');

      expect(service.getDAU).toHaveBeenCalledWith(new Date('2024-01-01'));
      expect(result).toEqual({ date: '2024-01-01', dau: 1000 });
    });
  });

  describe('getMAU', () => {
    it('should return Monthly Active Users', async () => {
      mockAnalyticsService.getMAU.mockResolvedValue(20000);

      const result = await controller.getMAU('2024', '1');

      expect(service.getMAU).toHaveBeenCalledWith(2024, 1);
      expect(result).toEqual({ year: 2024, month: 1, mau: 20000 });
    });
  });
});

