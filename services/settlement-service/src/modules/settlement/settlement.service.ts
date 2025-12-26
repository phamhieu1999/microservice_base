import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerBalance } from '../../database/entities/seller-balance.entity';
import { CommissionConfig } from '../../database/entities/commission-config.entity';
import { PayoutRequest } from '../../database/entities/payout-request.entity';
import { KafkaService } from '../../kafka/kafka.service';

@Injectable()
export class SettlementService {
  constructor(
    @InjectRepository(SellerBalance)
    private readonly balanceRepo: Repository<SellerBalance>,
    @InjectRepository(CommissionConfig)
    private readonly commissionRepo: Repository<CommissionConfig>,
    @InjectRepository(PayoutRequest)
    private readonly payoutRepo: Repository<PayoutRequest>,
    private readonly kafka: KafkaService,
  ) {}

  async getSellerBalance(sellerId: string) {
    let balance = await this.balanceRepo.findOne({ where: { sellerId } });
    if (!balance) {
      balance = this.balanceRepo.create({ sellerId, availableAmount: 0, pendingAmount: 0 });
      await this.balanceRepo.save(balance);
    }
    return balance;
  }

  async requestPayout(sellerId: string, amount: number) {
    const balance = await this.getSellerBalance(sellerId);
    if (Number(balance.availableAmount) < amount) {
      throw new BadRequestException('Insufficient available balance');
    }

    balance.availableAmount = Number(balance.availableAmount) - amount;
    balance.pendingAmount = Number(balance.pendingAmount) + amount;
    await this.balanceRepo.save(balance);

    const payout = this.payoutRepo.create({ sellerId, amount, status: 'REQUESTED' });
    await this.payoutRepo.save(payout);

    await this.kafka.emit('settlement.payout.requested', {
      sellerId,
      amount,
      payoutId: payout.id,
    });

    return { balance, payout };
  }

  async listPayouts(sellerId: string, status?: string, page = 1, limit = 20) {
    const where: any = { sellerId };
    if (status) where.status = status;

    const [items, total] = await this.payoutRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  // Áp dụng payment thành công cho seller: cộng tiền sau khi trừ commission
  async applyPaymentForSeller(sellerId: string, grossAmount: number) {
    const balance = await this.getSellerBalance(sellerId);

    // Tìm commission config theo seller, nếu không có thì default 10%
    const config = await this.commissionRepo.findOne({ where: { sellerId } });
    const rate = config ? Number(config.commissionRate) : 0.1;

    const commission = grossAmount * rate;
    const net = grossAmount - commission;

    balance.availableAmount = Number(balance.availableAmount) + net;
    await this.balanceRepo.save(balance);

    await this.kafka.emit('settlement.balance.updated', {
      sellerId,
      grossAmount,
      commission,
      net,
    });

    return { balance, grossAmount, commission, net };
  }
}
