import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher } from '../../database/entities/voucher.entity';
import { VoucherUsage } from '../../database/entities/voucher-usage.entity';

@Injectable()
export class PromotionRepository {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(VoucherUsage)
    private readonly usageRepo: Repository<VoucherUsage>,
  ) {}

  findByCode(code: string) {
    return this.voucherRepo.findOne({ where: { code } });
  }

  async countUsage(voucherId: string) {
    return this.usageRepo.count({ where: { voucherId } });
  }

  async countUsageByUser(voucherId: string, userId: string) {
    return this.usageRepo.count({ where: { voucherId, userId } });
  }

  async createUsage(voucherId: string, userId: string) {
    const usage = this.usageRepo.create({ voucherId, userId });
    await this.usageRepo.save(usage);
  }

  async createVoucher(partial: Partial<Voucher>): Promise<Voucher> {
    const voucher = this.voucherRepo.create(partial);
    return this.voucherRepo.save(voucher);
  }
}


