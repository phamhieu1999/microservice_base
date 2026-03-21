import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource, LessThan } from 'typeorm';
import { OutboxEvent, OutboxEventStatus } from './outbox-event.entity';

export interface IKafkaEmitter {
  emit(topic: string, payload: unknown): Promise<void>;
}

export const KAFKA_EMITTER = 'KAFKA_EMITTER';

@Injectable()
export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayService.name);
  private pollInterval = 5000;
  private readonly minInterval = 1000;
  private readonly maxInterval = 30000;
  private readonly batchSize = 100;
  private readonly maxRetries = 5;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly kafkaEmitter: IKafkaEmitter,
  ) {}

  onModuleInit() {
    this.running = true;
    this.schedulePoll();
    this.scheduleCleanup();
    this.logger.log(
      `Outbox relay started (initial interval: ${this.pollInterval}ms)`,
    );
  }

  onModuleDestroy() {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private schedulePoll() {
    if (!this.running) return;
    this.timer = setTimeout(async () => {
      await this.poll();
      this.schedulePoll();
    }, this.pollInterval);
  }

  private async poll() {
    try {
      const repo = this.dataSource.getRepository(OutboxEvent);

      const events = await repo
        .createQueryBuilder('e')
        .where('e.status = :status', { status: 'PENDING' })
        .andWhere('e.retryCount < :maxRetries', {
          maxRetries: this.maxRetries,
        })
        .orderBy('e.createdAt', 'ASC')
        .limit(this.batchSize)
        .setLock('pessimistic_write', undefined, ['e'])
        .setOnLocked('skip_locked')
        .getMany();

      if (events.length === 0) {
        this.pollInterval = Math.min(this.pollInterval * 2, this.maxInterval);
        return;
      }

      this.pollInterval = this.minInterval;

      for (const event of events) {
        try {
          await this.kafkaEmitter.emit(event.topic, event.payload);
          event.status = 'PUBLISHED' as OutboxEventStatus;
          event.publishedAt = new Date();
          await repo.save(event);
        } catch (err) {
          event.retryCount += 1;
          event.lastError = (err as Error).message;
          if (event.retryCount >= this.maxRetries) {
            event.status = 'FAILED' as OutboxEventStatus;
            this.logger.error(
              `Outbox event ${event.id} (${event.topic}) permanently failed after ${this.maxRetries} retries`,
            );
          }
          await repo.save(event);
        }
      }
    } catch (err) {
      this.logger.error(`Outbox poll error: ${(err as Error).message}`);
    }
  }

  private scheduleCleanup() {
    if (!this.running) return;

    const oneHour = 60 * 60 * 1000;
    setTimeout(async () => {
      try {
        const repo = this.dataSource.getRepository(OutboxEvent);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const result = await repo.delete({
          status: 'PUBLISHED' as OutboxEventStatus,
          publishedAt: LessThan(sevenDaysAgo),
        });
        if (result.affected && result.affected > 0) {
          this.logger.log(`Cleaned up ${result.affected} old outbox events`);
        }
      } catch (err) {
        this.logger.error(`Outbox cleanup error: ${(err as Error).message}`);
      }
      this.scheduleCleanup();
    }, oneHour);
  }
}
