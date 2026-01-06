import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search products' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (default: 20)' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of results to skip (default: 0)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'brand', required: false, description: 'Filter by brand' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    if (!query) {
      return { results: [], total: 0 };
    }

    const filters = {
      ...(category && { category }),
      ...(brand && { brand }),
      ...(minPrice && { minPrice: parseFloat(minPrice) }),
      ...(maxPrice && { maxPrice: parseFloat(maxPrice) }),
    };

    const results = await this.service.search(
      query,
      limit ? parseInt(limit, 10) : 20,
      skip ? parseInt(skip, 10) : 0,
      Object.keys(filters).length > 0 ? filters : undefined,
    );

    return {
      results: results.map((r) => ({
        productId: r.productId,
        name: r.name,
        description: r.description,
        price: r.price,
        stock: r.stock,
        category: r.category,
        brand: r.brand,
        sellerId: r.sellerId,
        score: (r as any).score,
        highlight: (r as any).highlight,
      })),
      total: results.length,
    };
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Get autocomplete suggestions' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query for autocomplete' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of suggestions (default: 10)' })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions' })
  async autocomplete(@Query('q') query: string, @Query('limit') limit?: string) {
    if (!query) {
      return { suggestions: [] };
    }

    // Use Elasticsearch autocomplete if available
    const service = this.service as any;
    if (service.elasticsearch) {
      const suggestions = await service.elasticsearch.autocomplete(
        query,
        limit ? parseInt(limit, 10) : 10,
      );
      return { suggestions };
    }

    return { suggestions: [] };
  }

  @Get('category')
  @ApiOperation({ summary: 'Search products by category' })
  @ApiQuery({ name: 'category', required: true, description: 'Category name' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (default: 20)' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of results to skip (default: 0)' })
  @ApiResponse({ status: 200, description: 'Products in category' })
  async searchByCategory(
    @Query('category') category: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    if (!category) {
      return { results: [], total: 0 };
    }

    const results = await this.service.searchByCategory(
      category,
      limit ? parseInt(limit, 10) : 20,
      skip ? parseInt(skip, 10) : 0,
    );

    return {
      results: results.map((r) => ({
        productId: r.productId,
        name: r.name,
        description: r.description,
        price: r.price,
        stock: r.stock,
        category: r.category,
        brand: r.brand,
        sellerId: r.sellerId,
      })),
      total: results.length,
    };
  }

  @Get('brand')
  @ApiOperation({ summary: 'Search products by brand' })
  @ApiQuery({ name: 'brand', required: true, description: 'Brand name' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (default: 20)' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of results to skip (default: 0)' })
  @ApiResponse({ status: 200, description: 'Products by brand' })
  async searchByBrand(
    @Query('brand') brand: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    if (!brand) {
      return { results: [], total: 0 };
    }

    const results = await this.service.searchByBrand(
      brand,
      limit ? parseInt(limit, 10) : 20,
      skip ? parseInt(skip, 10) : 0,
    );

    return {
      results: results.map((r) => ({
        productId: r.productId,
        name: r.name,
        description: r.description,
        price: r.price,
        stock: r.stock,
        category: r.category,
        brand: r.brand,
        sellerId: r.sellerId,
      })),
      total: results.length,
    };
  }
}

