import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CartProxyController } from './cart-proxy.controller';
import { CartProxyService } from './cart-proxy.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [CartProxyController],
  providers: [CartProxyService],
})
export class CartProxyModule {}


