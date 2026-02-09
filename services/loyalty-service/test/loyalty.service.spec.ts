import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyService } from '../src/modules/loyalty/loyalty.service';
import { UserPoints, LoyaltyTier } from '../src/database/entities/user-points.entity';
import { PointTransaction, PointTransactionType } from '../src/database/entities/point-transaction.entity';
import { PointTier } from '../src/database/entities/point-tier.entity';
import { Referral, ReferralStatus } from '../src/database/entities/referral.entity';
import { PromotionClient } from '../src/promotion/promotion.client';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let userPointsRepo: jest.Mocked<Repository<UserPoints>>;
  let txRepo: jest.Mocked<Repository<PointTransaction>>;
  let tierRepo: jest.Mocked<Repository<PointTier>>;
  let referralRepo: jest.Mocked<Repository<Referral>>;
  let promotionClient: jest.Mocked<PromotionClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        {
          provide: getRepositoryToken(UserPoints),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PointTransaction),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PointTier),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Referral),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: PromotionClient,
          useValue: {
            exchangePointsForVoucher: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
    userPointsRepo = module.get(getRepositoryToken(UserPoints));
    txRepo = module.get(getRepositoryToken(PointTransaction));
    tierRepo = module.get(getRepositoryToken(PointTier));
    referralRepo = module.get(getRepositoryToken(Referral));
    promotionClient = module.get(PromotionClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserPoints', () => {
    it('should return existing user points', async () => {
      const mockUserPoints = {
        id: '1',
        userId: 'user-123',
        balance: 1000,
        tier: 'SILVER' as LoyaltyTier,
        updatedAt: new Date(),
      };

      userPointsRepo.findOne.mockResolvedValue(mockUserPoints as UserPoints);

      const result = await service.getUserPoints('user-123');

      expect(userPointsRepo.findOne).toHaveBeenCalledWith({ where: { userId: 'user-123' } });
      expect(result).toEqual(mockUserPoints);
    });

    it('should create new user points if not exists', async () => {
      userPointsRepo.findOne.mockResolvedValue(null);
      const newUserPoints = {
        id: '1',
        userId: 'user-123',
        balance: 0,
        tier: 'BRONZE' as LoyaltyTier,
        updatedAt: new Date(),
      };

      userPointsRepo.create.mockReturnValue(newUserPoints as UserPoints);
      userPointsRepo.save.mockResolvedValue(newUserPoints as UserPoints);

      const result = await service.getUserPoints('user-123');

      expect(userPointsRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        balance: 0,
        tier: 'BRONZE',
      });
      expect(userPointsRepo.save).toHaveBeenCalled();
      expect(result).toEqual(newUserPoints);
    });
  });

  describe('earnPointsForPayment', () => {
    it('should earn points from payment amount', async () => {
      const mockUserPoints = {
        id: '1',
        userId: 'user-123',
        balance: 1000,
        tier: 'SILVER' as LoyaltyTier,
        updatedAt: new Date(),
      };

      userPointsRepo.findOne.mockResolvedValue(mockUserPoints as UserPoints);
      userPointsRepo.save.mockResolvedValue({
        ...mockUserPoints,
        balance: 1100,
      } as UserPoints);

      const mockTiers = [
        { name: 'BRONZE', minPoints: 0, maxPoints: 999 },
        { name: 'SILVER', minPoints: 1000, maxPoints: 4999 },
      ];
      tierRepo.find.mockResolvedValue(mockTiers as PointTier[]);
      userPointsRepo.update.mockResolvedValue({ affected: 1 } as any);

      const mockTx = {
        id: 'tx-1',
        userId: 'user-123',
        points: 100,
        type: 'EARN' as PointTransactionType,
        source: 'ORDER',
        referenceId: 'order-123',
        balanceAfter: 1100,
        createdAt: new Date(),
      };
      txRepo.create.mockReturnValue(mockTx as PointTransaction);
      txRepo.save.mockResolvedValue(mockTx as PointTransaction);

      const result = await service.earnPointsForPayment('user-123', 'order-123', 1000000);

      expect(result).toBeDefined();
      expect(result?.pointsEarned).toBe(100);
      expect(txRepo.save).toHaveBeenCalled();
    });

    it('should return null if points <= 0', async () => {
      const result = await service.earnPointsForPayment('user-123', 'order-123', 5000);
      expect(result).toBeNull();
    });
  });

  describe('redeemPoints', () => {
    it('should redeem points successfully', async () => {
      const mockUserPoints = {
        id: '1',
        userId: 'user-123',
        balance: 1000,
        tier: 'SILVER' as LoyaltyTier,
        updatedAt: new Date(),
      };

      userPointsRepo.findOne.mockResolvedValue(mockUserPoints as UserPoints);
      userPointsRepo.save.mockResolvedValue({
        ...mockUserPoints,
        balance: 500,
      } as UserPoints);

      const mockTiers = [
        { name: 'BRONZE', minPoints: 0, maxPoints: 999 },
        { name: 'SILVER', minPoints: 1000, maxPoints: 4999 },
      ];
      tierRepo.find.mockResolvedValue(mockTiers as PointTier[]);
      userPointsRepo.update.mockResolvedValue({ affected: 1 } as any);

      const mockTx = {
        id: 'tx-1',
        userId: 'user-123',
        points: -500,
        type: 'REDEEM' as PointTransactionType,
        source: 'REDEEM',
        referenceId: 'voucher-123',
        balanceAfter: 500,
        createdAt: new Date(),
      };
      txRepo.create.mockReturnValue(mockTx as PointTransaction);
      txRepo.save.mockResolvedValue(mockTx as PointTransaction);

      const result = await service.redeemPoints('user-123', 500, 'voucher-123');

      expect(result.balance).toBe(500);
      expect(result.pointsRedeemed).toBe(500);
      expect(txRepo.save).toHaveBeenCalled();
    });

    it('should throw error if insufficient points', async () => {
      const mockUserPoints = {
        id: '1',
        userId: 'user-123',
        balance: 100,
        tier: 'BRONZE' as LoyaltyTier,
        updatedAt: new Date(),
      };

      userPointsRepo.findOne.mockResolvedValue(mockUserPoints as UserPoints);

      await expect(service.redeemPoints('user-123', 500, 'voucher-123')).rejects.toThrow(
        'Insufficient points',
      );
    });
  });

  describe('createReferral', () => {
    it('should create referral code', async () => {
      const mockReferral = {
        id: 'ref-1',
        referrerUserId: 'user-123',
        referralCode: 'REF-user-123-1234567890',
        status: 'PENDING' as ReferralStatus,
        pointsAwarded: 0,
        createdAt: new Date(),
      };

      referralRepo.create.mockReturnValue(mockReferral as Referral);
      referralRepo.save.mockResolvedValue(mockReferral as Referral);

      const result = await service.createReferral('user-123');

      expect(referralRepo.create).toHaveBeenCalled();
      expect(referralRepo.save).toHaveBeenCalled();
      expect(result.referralCode).toContain('REF-user-123');
    });
  });
});

