import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { OutboxEvent } from './outbox-event.entity';

export interface SaveOutboxEventInput {
  aggregateType: string;
  aggregateId: string;
  topic: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly dataSource: DataSource) {}

  async saveEvent(
    input: SaveOutboxEventInput,
    manager?: EntityManager,
  ): Promise<OutboxEvent> {
    const repo = manager
      ? manager.getRepository(OutboxEvent)
      : this.dataSource.getRepository(OutboxEvent);

    const event = repo.create({
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      topic: input.topic,
      payload: input.payload,
      status: 'PENDING',
      retryCount: 0,
    });

    return repo.save(event);
  }

  async executeInTransaction<T>(
    operation: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      return operation(manager);
    });
  }
}
