import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMFA } from '../../../database/entities/user-mfa.entity';
import { MFAService } from './mfa.service';
import { MFAController } from './mfa.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserMFA])],
  controllers: [MFAController],
  providers: [MFAService],
  exports: [MFAService],
})
export class MFAModule {}

