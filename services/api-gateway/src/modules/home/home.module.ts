import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HomeService } from './home.service';
import { HomeController } from './home.controller';

@Module({
  imports: [HttpModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
