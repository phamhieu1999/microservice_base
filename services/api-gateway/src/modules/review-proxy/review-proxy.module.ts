import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReviewProxyController } from './review-proxy.controller';
import { ReviewProxyService } from './review-proxy.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [ReviewProxyController],
  providers: [ReviewProxyService],
})
export class ReviewProxyModule {}


