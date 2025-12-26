import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatProxyService } from './chat-proxy.service';
import { ChatProxyController } from './chat-proxy.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [ChatProxyController],
  providers: [ChatProxyService],
})
export class ChatProxyModule {}


