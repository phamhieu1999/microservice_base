import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerBalance } from '../../database/entities/seller-balance.entity';
import { CommissionConfig } from '../../database/entities/commission-config.entity';
import { PayoutRequest } from '../../database/entities/payout-request.entity';
import { SettlementService } from './settlement.service';
import { KafkaService } from '../../kafka/kafka.service';
import { BadRequestException } from '@nestjs/common';

describe('SettlementService', () => {
  let service: SettlementService;
  let balanceRepo: Repository<SellerBalance>;
  let commissionRepo: Repository<CommissionConfig>;
  let payoutRepo: Repository<PayoutRequest>;
  let kafka: KafkaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SettlementService,
        { provide: getRepositoryToken(SellerBalance), useClass: Repository },
        { provide: getRepositoryToken(CommissionConfig), useClass: Repository },
        { provide: getRepositoryToken(PayoutRequest), useClass: Repository },
        { provide: KafkaService, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(SettlementService);
    balanceRepo = moduleRef.get(getRepositoryToken(SellerBalance));
    commissionRepo = moduleRef.get(getRepositoryToken(CommissionConfig));
    payoutRepo = moduleRef.get(getRepositoryToken(PayoutRequest));
    kafka = moduleRef.get(KafkaService);
  });

  it('applyPaymentForSeller() should use commission config and emit settlement.balance.updated', async () => {
    jest.spyOn(service, 'getSellerBalance').mockResolvedValue({
      sellerId: 's1',
      availableAmount: 0,
      pendingAmount: 0,
    } as any);

    jest
      .spyOn(commissionRepo, 'findOne')
      .mockResolvedValue({ sellerId: 's1', commissionRate: 0.2 } as any);

    const saveSpy = jest.spyOn(balanceRepo, 'save').mockResolvedValue({} as any);

    const result = await service.applyPaymentForSeller('s1', 100000);

    expect(saveSpy).toHaveBeenCalled();
    expect(result.commission).toBe(20000);
    expect(result.net).toBe(80000);
    expect(kafka.emit).toHaveBeenCalledWith('settlement.balance.updated', {
      sellerId: 's1',
      grossAmount: 100000,
      commission: 20000,
      net: 80000,
    });
  });

  it('requestPayout() should move available -> pending and emit settlement.payout.requested', async () => {
    jest.spyOn(service, 'getSellerBalance').mockResolvedValue({
      id: 'b1',
      sellerId: 's1',
      availableAmount: 100000,
      pendingAmount: 0,
    } as any);

    const saveSpy = jest.spyOn(balanceRepo, 'save').mockResolvedValue({} as any);
    jest.spyOn(payoutRepo, 'create').mockReturnValue({ id: 'p1' } as any);
    jest.spyOn(payoutRepo, 'save').mockResolvedValue({ id: 'p1' } as any);

    const res = await service.requestPayout('s1', 50000);

    expect(saveSpy).toHaveBeenCalled();
    expect(res.payout.id).toBe('p1');
    expect(kafka.emit).toHaveBeenCalledWith('settlement.payout.requested', {
      sellerId: 's1',
      amount: 50000,
      payoutId: 'p1',
    });
  });

  it('requestPayout() should throw if insufficient balance', async () => {
    jest.spyOn(service, 'getSellerBalance').mockResolvedValue({
      sellerId: 's1',
      availableAmount: 10000,
      pendingAmount: 0,
    } as any);

    await expect(service.requestPayout('s1', 50000)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
