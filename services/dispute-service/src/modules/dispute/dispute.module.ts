import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispute } from '../../database/entities/dispute.entity';
import { DisputeService } from './dispute.service';
import { DisputeController } from './dispute.controller';
import { KafkaService } from '../../kafka/kafka.service';
import { DisputeAdminController } from './dispute.admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Dispute])],
  controllers: [DisputeController, DisputeAdminController],
  providers: [DisputeService, KafkaService],
})
export class DisputeModule {}
