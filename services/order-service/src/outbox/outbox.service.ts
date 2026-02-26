import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { OutboxEvent } from '../database/entities/outbox-event.entity';

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

  /**
   * Save an outbox event within the SAME transaction as the business operation.
   * If a manager is provided, use it (caller manages the transaction).
   * Otherwise, create a standalone save.
   */
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

  /**
   * Run a business operation + outbox event save in a single DB transaction.
   * Guarantees atomicity: both succeed or both fail.
   */
  async executeInTransaction<T>(
    operation: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      return operation(manager);
    });
  }
}
