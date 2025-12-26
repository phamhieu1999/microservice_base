import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
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

