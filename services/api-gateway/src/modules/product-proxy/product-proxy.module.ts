import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProductProxyController } from './product-proxy.controller';
import { ProductProxyService } from './product-proxy.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [ProductProxyController],
  providers: [ProductProxyService],
})
export class ProductProxyModule {}


