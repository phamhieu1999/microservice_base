import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PromotionProxyService } from './promotion-proxy.service';

@Module({
  imports: [HttpModule],
  providers: [PromotionProxyService],
  exports: [PromotionProxyService],
})
export class PromotionProxyModule {}


