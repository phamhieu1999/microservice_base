import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDevice } from '../../../database/entities/user-device.entity';
import { DeviceRepository } from './device.repository';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserDevice])],
  controllers: [DeviceController],
  providers: [DeviceRepository, DeviceService],
  exports: [DeviceService],
})
export class DeviceModule {}

