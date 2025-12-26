import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WarehouseProxyService } from './warehouse-proxy.service';
import { WarehouseProxyController } from './warehouse-proxy.controller';

@Module({
  imports: [HttpModule],
  controllers: [WarehouseProxyController],
  providers: [WarehouseProxyService],
  exports: [WarehouseProxyService],
})
export class WarehouseProxyModule {}

