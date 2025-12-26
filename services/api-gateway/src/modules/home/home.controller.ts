import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HomeService } from './home.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('home')
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @ApiOperation({ summary: 'Get home feed (flash sale, top products, recent orders)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getHome(@Req() req: any) {
    const userId = req.user?.userId;
    return this.homeService.getHomeFeed(userId);
  }
}
