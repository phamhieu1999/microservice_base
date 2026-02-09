import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SearchProxyService {
  private readonly searchBaseUrl = process.env.SEARCH_SERVICE_URL || 'http://search-service:3012';

  constructor(private readonly http: HttpService) {}

  async forwardSearch(query: string, limit?: number, skip?: number) {
    const params: any = { q: query };
    if (limit) params.limit = limit;
    if (skip) params.skip = skip;

    const res = await firstValueFrom(
      this.http.get(`${this.searchBaseUrl}/search`, { params }),
    );
    return res.data;
  }

  async forwardSearchByCategory(category: string, limit?: number, skip?: number) {
    const params: any = { category };
    if (limit) params.limit = limit;
    if (skip) params.skip = skip;

    const res = await firstValueFrom(
      this.http.get(`${this.searchBaseUrl}/search/category`, { params }),
    );
    return res.data;
  }

  async forwardSearchByBrand(brand: string, limit?: number, skip?: number) {
    const params: any = { brand };
    if (limit) params.limit = limit;
    if (skip) params.skip = skip;

    const res = await firstValueFrom(
      this.http.get(`${this.searchBaseUrl}/search/brand`, { params }),
    );
    return res.data;
  }

  async forwardAutocomplete(query: string, limit?: number) {
    const params: any = { q: query };
    if (limit) params.limit = limit;

    const res = await firstValueFrom(
      this.http.get(`${this.searchBaseUrl}/search/autocomplete`, { params }),
    );
    return res.data;
  }
}

