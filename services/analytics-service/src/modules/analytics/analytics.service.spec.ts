import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { RevenueMetric, RevenueMetricDocument } from './schemas/revenue-metric.schema';
import { ProductMetric, ProductMetricDocument } from './schemas/product-metric.schema';
import { UserMetric, UserMetricDocument } from './schemas/user-metric.schema';
import { SellerMetric, SellerMetricDocument } from './schemas/seller-metric.schema';
import { Model } from 'mongoose';
import { CacheService } from '../../common/cache/cache.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let revenueModel: Model<RevenueMetricDocument>;
  let productModel: Model<ProductMetricDocument>;
  let userModel: Model<UserMetricDocument>;
  let sellerModel: Model<SellerMetricDocument>;

  const mockRevenueMetric = {
    _id: '507f1f77bcf86cd799439011',
    date: new Date('2024-01-01'),
    revenue: 10000000,
    orderCount: 100,
    averageOrderValue: 100000,
    period: 'daily',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProductMetric = {
    _id: '507f1f77bcf86cd799439012',
    productId: 'prod_001',
    productName: 'Test Product',
    category: 'Electronics',
    sellerId: 'seller_001',
    salesCount: 100,
    revenue: 10000000,
    views: 2000,
    conversionRate: 5.0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserMetric = {
    _id: '507f1f77bcf86cd799439013',
    date: new Date('2024-01-01'),
    dailyActiveUsers: 1000,
    monthlyActiveUsers: 20000,
    newUsers: 50,
    retentionRate: 60.5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSellerMetric = {
    _id: '507f1f77bcf86cd799439014',
    sellerId: 'seller_001',
    totalNetRevenue: 50000000,
    totalCommission: 5000000,
    totalPayout: 40000000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMockQuery = (data: any) => ({
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(data),
  });

  const mockRevenueModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    collection: {
      createIndex: jest.fn(),
    },
  };

  const mockProductModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    collection: {
      createIndex: jest.fn(),
    },
  };

  const mockUserModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    collection: {
      createIndex: jest.fn(),
    },
  };

  const mockSellerModel = {
    findOneAndUpdate: jest.fn(),
    collection: {
      createIndex: jest.fn(),
    },
  };

  const mockCacheService = {
    getOrSet: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getModelToken(RevenueMetric.name),
          useValue: mockRevenueModel,
        },
        {
          provide: getModelToken(ProductMetric.name),
          useValue: mockProductModel,
        },
        {
          provide: getModelToken(UserMetric.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(SellerMetric.name),
          useValue: mockSellerModel,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    revenueModel = module.get<Model<RevenueMetricDocument>>(getModelToken(RevenueMetric.name));
    productModel = module.get<Model<ProductMetricDocument>>(getModelToken(ProductMetric.name));
    userModel = module.get<Model<UserMetricDocument>>(getModelToken(UserMetric.name));
    sellerModel = module.get<Model<SellerMetricDocument>>(getModelToken(SellerMetric.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRevenueByPeriod', () => {
    it('should return revenue metrics for a period', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');
      const mockQuery = createMockQuery([mockRevenueMetric]);

      mockRevenueModel.find.mockReturnValue(mockQuery);

      const result = await service.getRevenueByPeriod(startDate, endDate, 'daily');

      expect(mockRevenueModel.find).toHaveBeenCalledWith({
        date: { $gte: startDate, $lte: endDate },
        period: 'daily',
      });
      expect(result).toEqual([mockRevenueMetric]);
    });
  });

  describe('getTotalRevenue', () => {
    it('should return total revenue summary', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');
      const mockQuery = createMockQuery([mockRevenueMetric, { ...mockRevenueMetric, revenue: 15000000, orderCount: 150 }]);

      mockRevenueModel.find.mockReturnValue(mockQuery);

      const result = await service.getTotalRevenue(startDate, endDate);

      expect(result.totalRevenue).toBe(25000000);
      expect(result.totalOrders).toBe(250);
    });
  });

  describe('getTopProducts', () => {
    it('should return top products sorted by sales', async () => {
      const mockQuery = createMockQuery([mockProductMetric]);
      mockProductModel.find.mockReturnValue(mockQuery);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      const result = await service.getTopProducts(10, 'sales');

      expect(mockProductModel.find).toHaveBeenCalled();
      expect(result).toEqual([mockProductMetric]);
    });

    it('should return top products sorted by revenue', async () => {
      const mockQuery = createMockQuery([mockProductMetric]);
      mockProductModel.find.mockReturnValue(mockQuery);
      mockCacheService.getOrSet.mockImplementation((key, fn) => fn());

      const result = await service.getTopProducts(10, 'revenue');

      expect(mockProductModel.find).toHaveBeenCalled();
      expect(result).toEqual([mockProductMetric]);
    });
  });

  describe('getProductMetrics', () => {
    it('should return product metrics by productId', async () => {
      mockProductModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProductMetric),
      });

      const result = await service.getProductMetrics('prod_001');

      expect(mockProductModel.findOne).toHaveBeenCalledWith({ productId: 'prod_001' });
      expect(result).toEqual(mockProductMetric);
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products by category', async () => {
      const mockQuery = createMockQuery([mockProductMetric]);
      mockProductModel.find.mockReturnValue(mockQuery);

      const result = await service.getProductsByCategory('Electronics');

      expect(mockProductModel.find).toHaveBeenCalledWith({ category: 'Electronics' });
      expect(result).toEqual([mockProductMetric]);
    });
  });

  describe('getProductsBySeller', () => {
    it('should return paginated products by seller', async () => {
      const mockQuery = createMockQuery([mockProductMetric]);
      mockProductModel.find.mockReturnValue(mockQuery);
      mockProductModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.getProductsBySeller('seller_001', 1, 20);

      expect(mockProductModel.find).toHaveBeenCalledWith({ sellerId: 'seller_001' });
      expect(result.items).toEqual([mockProductMetric]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('getUserMetrics', () => {
    it('should return user metrics for a date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');
      const mockQuery = createMockQuery([mockUserMetric]);

      mockUserModel.find.mockReturnValue(mockQuery);

      const result = await service.getUserMetrics(startDate, endDate);

      expect(mockUserModel.find).toHaveBeenCalledWith({
        date: { $gte: startDate, $lte: endDate },
      });
      expect(result).toEqual([mockUserMetric]);
    });
  });

  describe('getDAU', () => {
    it('should return Daily Active Users for a date', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserMetric),
      });

      const result = await service.getDAU(new Date('2024-01-01'));

      expect(result).toBe(1000);
    });

    it('should return 0 if no metric found', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.getDAU(new Date('2024-01-01'));

      expect(result).toBe(0);
    });
  });

  describe('getMAU', () => {
    it('should return Monthly Active Users for a month', async () => {
      mockUserModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockUserMetric]),
      });

      const result = await service.getMAU(2024, 1);

      expect(result).toBe(20000);
    });

    it('should return 0 if no metrics found', async () => {
      mockUserModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getMAU(2024, 1);

      expect(result).toBe(0);
    });
  });

  describe('aggregateRevenue', () => {
    it('should aggregate revenue metrics', async () => {
      mockRevenueModel.findOneAndUpdate.mockResolvedValue(mockRevenueMetric);

      await service.aggregateRevenue(new Date('2024-01-01'), 10000000, 100);

      expect(mockRevenueModel.findOneAndUpdate).toHaveBeenCalled();
    });
  });

  describe('aggregateProduct', () => {
    it('should aggregate product metrics', async () => {
      const mockProductWithSave = {
        ...mockProductMetric,
        views: 2000,
        salesCount: 100,
        save: jest.fn().mockResolvedValue(mockProductMetric),
      };
      mockProductModel.findOneAndUpdate.mockResolvedValue(mockProductMetric);
      mockProductModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProductWithSave),
      });

      await service.aggregateProduct('prod_001', 'Test Product', 10000000, 'Electronics', 'seller_001');

      expect(mockProductModel.findOneAndUpdate).toHaveBeenCalled();
      expect(mockProductModel.findOne).toHaveBeenCalledWith({ productId: 'prod_001' });
    });
  });

  describe('aggregateUser', () => {
    it('should aggregate user metrics', async () => {
      mockUserModel.findOneAndUpdate.mockResolvedValue(mockUserMetric);

      await service.aggregateUser(new Date('2024-01-01'), false);

      expect(mockUserModel.findOneAndUpdate).toHaveBeenCalled();
    });
  });

  describe('aggregateSellerSettlement', () => {
    it('should aggregate seller settlement', async () => {
      mockSellerModel.findOneAndUpdate.mockResolvedValue(mockSellerMetric);

      await service.aggregateSellerSettlement('seller_001', 50000000, 5000000);

      expect(mockSellerModel.findOneAndUpdate).toHaveBeenCalled();
    });
  });

  describe('aggregateSellerPayout', () => {
    it('should aggregate seller payout', async () => {
      mockSellerModel.findOneAndUpdate.mockResolvedValue(mockSellerMetric);

      await service.aggregateSellerPayout('seller_001', 40000000);

      expect(mockSellerModel.findOneAndUpdate).toHaveBeenCalled();
    });
  });
});

