import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminProxyService } from './admin-proxy.service';
import { AdminProxyController } from './admin-proxy.controller';

@Module({
  imports: [HttpModule],
  controllers: [AdminProxyController],
  providers: [AdminProxyService],
})
export class AdminProxyModule {}
