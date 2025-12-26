import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Dispute } from '../../database/entities/dispute.entity';
import { KafkaService } from '../../kafka/kafka.service';
import {
  DISPUTE_ESCALATED_TOPIC,
  DISPUTE_OPENED_TOPIC,
  DISPUTE_RESOLVED_TOPIC,
} from './events/dispute-events';

@Injectable()
export class DisputeService {
  constructor(
    @InjectRepository(Dispute)
    private readonly disputeRepo: Repository<Dispute>,
    private readonly kafka: KafkaService,
  ) {}

  async create(data: Partial<Dispute>) {
    const dispute = this.disputeRepo.create({
      ...data,
      status: 'OPEN',
      createdBy: data.userId,
    });
    const saved = await this.disputeRepo.save(dispute);
    await this.kafka.emit(DISPUTE_OPENED_TOPIC, {
      id: saved.id,
      orderId: saved.orderId,
      userId: saved.userId,
      sellerId: saved.sellerId,
      reasonCode: saved.reasonCode,
    });
    return saved;
  }

  findById(id: string) {
    return this.disputeRepo.findOne({ where: { id } });
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.disputeRepo.findAndCount({
      where: { userId },
      select: [
        'id',
        'orderId',
        'userId',
        'sellerId',
        'status',
        'reasonCode',
        'description',
        'attachments',
        'resolution',
        'createdAt',
        'updatedAt',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listWithFilters(params: {
    status?: string;
    sellerId?: string;
    userId?: string;
    page: number;
    limit: number;
  }) {
    const where: FindOptionsWhere<Dispute> = {};
    if (params.status) where.status = params.status as any;
    if (params.sellerId) where.sellerId = params.sellerId;
    if (params.userId) where.userId = params.userId;

    const [items, total] = await this.disputeRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
    return { items, total };
  }

  async sellerReply(id: string, actorId: string, message?: string) {
    // Ở mức skeleton, chỉ đổi status; message có thể lưu vào hệ thống chat/log riêng
    await this.disputeRepo.update(
      { id },
      { status: 'SELLER_RESPONDED', updatedBy: actorId },
    );
    return this.findById(id);
  }

  async escalate(id: string, actorId: string, reason?: string) {
    await this.disputeRepo.update(
      { id },
      { status: 'ESCALATED', escalatedAt: new Date(), updatedBy: actorId },
    );
    const dispute = await this.findById(id);
    if (dispute) {
      await this.kafka.emit(DISPUTE_ESCALATED_TOPIC, {
        id: dispute.id,
        orderId: dispute.orderId,
        userId: dispute.userId,
        sellerId: dispute.sellerId,
      });
    }
    return dispute;
  }

  async resolve(
    id: string,
    actorId: string,
    decision: 'RESOLVED' | 'REJECTED',
    resolution?: string,
  ) {
    await this.disputeRepo.update(
      { id },
      {
        status: decision,
        resolution,
        resolvedAt: new Date(),
        updatedBy: actorId,
      },
    );
    const dispute = await this.findById(id);
    if (dispute) {
      await this.kafka.emit(DISPUTE_RESOLVED_TOPIC, {
        id: dispute.id,
        orderId: dispute.orderId,
        userId: dispute.userId,
        sellerId: dispute.sellerId,
        decision,
      });
    }
    return dispute;
  }
}
