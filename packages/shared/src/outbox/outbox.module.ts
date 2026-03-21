import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent } from './outbox-event.entity';
import { OutboxService } from './outbox.service';
import { OutboxRelayService, KAFKA_EMITTER, IKafkaEmitter } from './outbox-relay.service';

@Module({})
export class OutboxModule {
  static register(kafkaEmitterProvider: { useExisting: any } | { useClass: any }): DynamicModule {
    return {
      module: OutboxModule,
      imports: [TypeOrmModule.forFeature([OutboxEvent])],
      providers: [
        OutboxService,
        {
          provide: KAFKA_EMITTER,
          ...kafkaEmitterProvider,
        },
        {
          provide: OutboxRelayService,
          useFactory: (dataSource: any, kafkaEmitter: IKafkaEmitter) =>
            new OutboxRelayService(dataSource, kafkaEmitter),
          inject: ['DataSource', KAFKA_EMITTER],
        },
      ],
      exports: [OutboxService],
    };
  }

  static forRoot(): DynamicModule {
    return {
      module: OutboxModule,
      imports: [TypeOrmModule.forFeature([OutboxEvent])],
      providers: [OutboxService, OutboxRelayService],
      exports: [OutboxService],
    };
  }
}
