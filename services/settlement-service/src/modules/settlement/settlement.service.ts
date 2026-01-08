import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerBalance } from '../../database/entities/seller-balance.entity';
import { CommissionConfig } from '../../database/entities/commission-config.entity';
import { PayoutRequest, PayoutStatus } from '../../database/entities/payout-request.entity';
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

  async requestPayout(sellerId: string, amount: number, note?: string) {
    const balance = await this.getSellerBalance(sellerId);
    if (Number(balance.availableAmount) < amount) {
      throw new BadRequestException('Insufficient available balance');
    }

    balance.availableAmount = Number(balance.availableAmount) - amount;
    balance.pendingAmount = Number(balance.pendingAmount) + amount;
    await this.balanceRepo.save(balance);

    const payout = this.payoutRepo.create({ sellerId, amount, status: 'REQUESTED', note });
    await this.payoutRepo.save(payout);

    await this.kafka.emit('settlement.payout.requested', {
      sellerId,
      amount,
      payoutId: payout.id,
    });

    return { balance, payout };
  }

  async updatePayoutStatus(payoutId: string, status: PayoutStatus, note?: string) {
    const payout = await this.payoutRepo.findOne({ where: { id: payoutId } });
    if (!payout) {
      throw new NotFoundException('Payout request not found');
    }

    const oldStatus = payout.status;
    payout.status = status;
    if (note) {
      payout.note = note;
    }
    await this.payoutRepo.save(payout);

    // Nếu chuyển từ REQUESTED sang APPROVED hoặc PAID, giữ nguyên pending
    // Nếu chuyển sang PAID, chuyển pending về 0
    if (oldStatus === 'REQUESTED' && status === 'PAID') {
      const balance = await this.getSellerBalance(payout.sellerId);
      balance.pendingAmount = Number(balance.pendingAmount) - Number(payout.amount);
      await this.balanceRepo.save(balance);
    }

    // Nếu reject, trả lại tiền vào available
    if (oldStatus === 'REQUESTED' && status === 'REJECTED') {
      const balance = await this.getSellerBalance(payout.sellerId);
      balance.availableAmount = Number(balance.availableAmount) + Number(payout.amount);
      balance.pendingAmount = Number(balance.pendingAmount) - Number(payout.amount);
      await this.balanceRepo.save(balance);
    }

    await this.kafka.emit('settlement.payout.status.updated', {
      payoutId,
      sellerId: payout.sellerId,
      oldStatus,
      newStatus: status,
      amount: payout.amount,
    });

    return payout;
  }

  async getPayoutById(payoutId: string) {
    const payout = await this.payoutRepo.findOne({ where: { id: payoutId } });
    if (!payout) {
      throw new NotFoundException('Payout request not found');
    }
    return payout;
  }

  async createCommissionConfig(sellerId?: string, categoryId?: string, commissionRate: number = 0.1) {
    if (!sellerId && !categoryId) {
      throw new BadRequestException('Either sellerId or categoryId must be provided');
    }

    const config = this.commissionRepo.create({ sellerId, categoryId, commissionRate });
    return await this.commissionRepo.save(config);
  }

  async getCommissionConfigs(sellerId?: string, categoryId?: string) {
    const where: any = {};
    if (sellerId) where.sellerId = sellerId;
    if (categoryId) where.categoryId = categoryId;
    return await this.commissionRepo.find({ where });
  }

  async getCommissionConfig(sellerId?: string, categoryId?: string) {
    // Ưu tiên tìm theo seller, sau đó category, cuối cùng là default
    if (sellerId) {
      const sellerConfig = await this.commissionRepo.findOne({ where: { sellerId } });
      if (sellerConfig) return sellerConfig;
    }
    if (categoryId) {
      const categoryConfig = await this.commissionRepo.findOne({ where: { categoryId } });
      if (categoryConfig) return categoryConfig;
    }
    return null; // Default sẽ được xử lý ở service
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
