import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyController } from '../src/modules/loyalty/loyalty.controller';
import { LoyaltyService } from '../src/modules/loyalty/loyalty.service';

describe('LoyaltyController', () => {
  let controller: LoyaltyController;
  let service: jest.Mocked<LoyaltyService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoyaltyController],
      providers: [
        {
          provide: LoyaltyService,
          useValue: {
            getUserPoints: jest.fn(),
            getPointHistory: jest.fn(),
            redeemPoints: jest.fn(),
            exchangePointsForVoucher: jest.fn(),
            createReferral: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LoyaltyController>(LoyaltyController);
    service = module.get(LoyaltyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPoints', () => {
    it('should return user points', async () => {
      const mockUserPoints = {
        id: '1',
        userId: 'user-123',
        balance: 1000,
        tier: 'SILVER',
        updatedAt: new Date(),
      };

      service.getUserPoints.mockResolvedValue(mockUserPoints as any);

      const req = {
        user: { userId: 'user-123' },
        headers: {},
      };

      const result = await controller.getPoints(req as any);

      expect(service.getUserPoints).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUserPoints);
    });

    it('should use x-user-id header if user not in request', async () => {
      const mockUserPoints = {
        id: '1',
        userId: 'user-456',
        balance: 500,
        tier: 'BRONZE',
        updatedAt: new Date(),
      };

      service.getUserPoints.mockResolvedValue(mockUserPoints as any);

      const req = {
        headers: { 'x-user-id': 'user-456' },
      };

      const result = await controller.getPoints(req as any);

      expect(service.getUserPoints).toHaveBeenCalledWith('user-456');
      expect(result).toEqual(mockUserPoints);
    });
  });

  describe('getHistory', () => {
    it('should return point history', async () => {
      const mockHistory = [
        {
          id: 'tx-1',
          userId: 'user-123',
          points: 100,
          type: 'EARN',
          createdAt: new Date(),
        },
      ];

      service.getPointHistory.mockResolvedValue(mockHistory as any);

      const req = {
        user: { userId: 'user-123' },
        headers: {},
      };

      const result = await controller.getHistory(req as any, '10', '0');

      expect(service.getPointHistory).toHaveBeenCalledWith('user-123', 10, 0);
      expect(result).toEqual(mockHistory);
    });
  });

  describe('redeem', () => {
    it('should redeem points with voucherId', async () => {
      const mockResult = {
        balance: 500,
        tier: 'SILVER',
        pointsRedeemed: 500,
      };

      service.redeemPoints.mockResolvedValue(mockResult as any);

      const req = {
        user: { userId: 'user-123' },
        headers: {},
      };

      const dto = {
        points: 500,
        voucherId: 'voucher-123',
      };

      const result = await controller.redeem(req as any, dto);

      expect(service.redeemPoints).toHaveBeenCalledWith('user-123', 500, 'voucher-123');
      expect(result).toEqual(mockResult);
    });

    it('should exchange points for voucher if no voucherId', async () => {
      const mockResult = {
        balance: 500,
        tier: 'SILVER',
        pointsRedeemed: 500,
        voucher: { id: 'voucher-456' },
      };

      service.exchangePointsForVoucher.mockResolvedValue(mockResult as any);

      const req = {
        user: { userId: 'user-123' },
        headers: {},
      };

      const dto = {
        points: 500,
      };

      const result = await controller.redeem(req as any, dto);

      expect(service.exchangePointsForVoucher).toHaveBeenCalledWith('user-123', 500);
      expect(result).toEqual(mockResult);
    });
  });

  describe('createReferral', () => {
    it('should create referral code', async () => {
      const mockReferral = {
        id: 'ref-1',
        referrerUserId: 'user-123',
        referralCode: 'REF-user-123-1234567890',
        status: 'PENDING',
        createdAt: new Date(),
      };

      service.createReferral.mockResolvedValue(mockReferral as any);

      const req = {
        user: { userId: 'user-123' },
        headers: {},
      };

      const result = await controller.createReferral(req as any, {} as any);

      expect(service.createReferral).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockReferral);
    });
  });
});

