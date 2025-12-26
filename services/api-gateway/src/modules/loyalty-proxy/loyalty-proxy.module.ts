import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LoyaltyProxyService } from './loyalty-proxy.service';
import { LoyaltyProxyController } from './loyalty-proxy.controller';

@Module({
  imports: [HttpModule],
  controllers: [LoyaltyProxyController],
  providers: [LoyaltyProxyService],
})
export class LoyaltyProxyModule {}


