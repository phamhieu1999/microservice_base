import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SearchProxyService } from './search-proxy.service';

@Controller('search')
export class SearchProxyController {
  constructor(private readonly service: SearchProxyService) {}

  @Throttle(30, 60) // 30 requests per minute
  @Get()
  search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.service.forwardSearch(
      query,
      limit ? parseInt(limit, 10) : undefined,
      skip ? parseInt(skip, 10) : undefined,
    );
  }

  @Throttle(30, 60) // 30 requests per minute
  @Get('category')
  searchByCategory(
    @Query('category') category: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.service.forwardSearchByCategory(
      category,
      limit ? parseInt(limit, 10) : undefined,
      skip ? parseInt(skip, 10) : undefined,
    );
  }

  @Throttle(30, 60) // 30 requests per minute
  @Get('brand')
  searchByBrand(
    @Query('brand') brand: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.service.forwardSearchByBrand(
      brand,
      limit ? parseInt(limit, 10) : undefined,
      skip ? parseInt(skip, 10) : undefined,
    );
  }
}

