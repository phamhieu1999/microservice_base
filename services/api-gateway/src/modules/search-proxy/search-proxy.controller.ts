import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SearchProxyService } from './search-proxy.service';

@ApiTags('search')
@Controller('search')
export class SearchProxyController {
  constructor(private readonly service: SearchProxyService) {}

  @Throttle({ default: { limit: 30, ttl: 60 } }) // 30 requests per minute
  @Get()
  @ApiOperation({ summary: 'Tìm kiếm sản phẩm theo từ khoá' })
  @ApiQuery({ name: 'q', required: true, description: 'Từ khoá tìm kiếm' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
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

  @Throttle({ default: { limit: 30, ttl: 60 } }) // 30 requests per minute
  @Get('category')
  @ApiOperation({ summary: 'Tìm kiếm sản phẩm theo danh mục' })
  @ApiQuery({ name: 'category', required: true, description: 'Mã/slug danh mục' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
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

  @Throttle({ default: { limit: 30, ttl: 60 } }) // 30 requests per minute
  @Get('brand')
  @ApiOperation({ summary: 'Tìm kiếm sản phẩm theo thương hiệu' })
  @ApiQuery({ name: 'brand', required: true, description: 'Tên/mã thương hiệu' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
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

  @Throttle({ default: { limit: 60, ttl: 60 } }) // 60 requests per minute for autocomplete
  @Get('autocomplete')
  @ApiOperation({ summary: 'Lấy gợi ý autocomplete cho từ khóa tìm kiếm' })
  @ApiQuery({ name: 'q', required: true, description: 'Từ khóa tìm kiếm' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng gợi ý (default: 10)' })
  autocomplete(@Query('q') query: string, @Query('limit') limit?: string) {
    return this.service.forwardAutocomplete(query, limit ? parseInt(limit, 10) : undefined);
  }
}

