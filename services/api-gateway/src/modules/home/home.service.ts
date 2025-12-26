import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HomeService {
  private readonly searchBaseUrl = process.env.SEARCH_SERVICE_URL || 'http://search-service:3012';
  private readonly analyticsBaseUrl = process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3014';
  private readonly orderBaseUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';

  constructor(private readonly http: HttpService) {}

  async getHomeFeed(userId?: string) {
    const [flashSale, topProducts] = await Promise.all([
      this.fetchFlashSale(),
      this.fetchTopProducts(),
    ]);

    const recentOrders = userId ? await this.fetchRecentOrders(userId) : [];

    return {
      flashSale,
      topProducts,
      recentOrders,
    };
  }

  private async fetchFlashSale() {
    const res = await firstValueFrom(
      this.http.get(`${this.searchBaseUrl}/search`, {
        params: { q: '', limit: 20, flashSale: true },
      }),
    );
    return res.data;
  }

  private async fetchTopProducts() {
    const res = await firstValueFrom(
      this.http.get(`${this.analyticsBaseUrl}/analytics/products/top`, {
        params: { limit: 20, sortBy: 'sales' },
      }),
    );
    return res.data;
  }

  private async fetchRecentOrders(userId: string) {
    const res = await firstValueFrom(
      this.http.get(`${this.orderBaseUrl}/orders`, {
        params: { userId, limit: 10 },
      }),
    );
    return res.data;
  }
}
