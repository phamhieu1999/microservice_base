import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseController } from './warehouse.controller';
import { WarehouseService } from './warehouse.service';

describe('WarehouseController', () => {
  let controller: WarehouseController;
  let service: WarehouseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarehouseController],
      providers: [
        {
          provide: WarehouseService,
          useValue: {
            getDailyRevenue: jest.fn(),
            getTopSellers: jest.fn(),
            getTopProducts: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WarehouseController>(WarehouseController);
    service = module.get<WarehouseService>(WarehouseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDailyRevenue', () => {
    it('should return daily revenue data', async () => {
      const mockData = [
        { revenue_date: '2024-01-01', total_revenue: 1000, order_count: 10 },
      ];
      jest.spyOn(service, 'getDailyRevenue').mockResolvedValue(mockData);

      const result = await controller.getDailyRevenue({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(result).toEqual({
        data: mockData,
        total: mockData.length,
      });
      expect(service.getDailyRevenue).toHaveBeenCalled();
    });
  });

  describe('getTopSellers', () => {
    it('should return top sellers data', async () => {
      const mockData = [
        { seller_id: 'seller_1', total_revenue: 5000, order_count: 50 },
      ];
      jest.spyOn(service, 'getTopSellers').mockResolvedValue(mockData);

      const result = await controller.getTopSellers('10', '2024-01-01', '2024-01-31');

      expect(result).toEqual({
        data: mockData,
        total: mockData.length,
      });
      expect(service.getTopSellers).toHaveBeenCalled();
    });
  });

  describe('getTopProducts', () => {
    it('should return top products data', async () => {
      const mockData = [
        { product_id: 'product_1', total_revenue: 3000, order_count: 30 },
      ];
      jest.spyOn(service, 'getTopProducts').mockResolvedValue(mockData);

      const result = await controller.getTopProducts('10', '2024-01-01', '2024-01-31');

      expect(result).toEqual({
        data: mockData,
        total: mockData.length,
      });
      expect(service.getTopProducts).toHaveBeenCalled();
    });
  });
});

