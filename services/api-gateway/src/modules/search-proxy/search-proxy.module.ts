import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SearchProxyController } from './search-proxy.controller';
import { SearchProxyService } from './search-proxy.service';

@Module({
  imports: [HttpModule],
  controllers: [SearchProxyController],
  providers: [SearchProxyService],
})
export class SearchProxyModule {}

