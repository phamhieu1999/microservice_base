import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SellerProxyController } from './seller-proxy.controller';
import { SellerProxyService } from './seller-proxy.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [SellerProxyController],
  providers: [SellerProxyService],
})
export class SellerProxyModule {}


