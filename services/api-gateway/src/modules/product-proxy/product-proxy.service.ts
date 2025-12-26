import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProductProxyService {
  private readonly productBaseUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';

  constructor(private readonly http: HttpService) {}

  async forwardCreate(body: any) {
    return this.circuitBreaker.execute(
      'product-service',
      async () => {
        const res = await firstValueFrom(this.http.post(`${this.productBaseUrl}/products`, body));
        return res.data;
      },
      async () => {
        throw new Error('Product service is temporarily unavailable');
      },
    );
  }

  async forwardFindAll(q?: string) {
    return this.circuitBreaker.execute(
      'product-service',
      async () => {
        const res = await firstValueFrom(
          this.http.get(`${this.productBaseUrl}/products`, { params: q ? { q } : {} }),
        );
        return res.data;
      },
      async () => {
        // Fallback: return empty array
        return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      },
    );
  }

  async forwardFindOne(id: string) {
    return this.circuitBreaker.execute(
      'product-service',
      async () => {
        const res = await firstValueFrom(this.http.get(`${this.productBaseUrl}/products/${id}`));
        return res.data;
      },
      async () => {
        throw new Error('Product service is temporarily unavailable');
      },
    );
  }

  async forwardUpdate(id: string, body: any) {
    return this.circuitBreaker.execute(
      'product-service',
      async () => {
        const res = await firstValueFrom(this.http.patch(`${this.productBaseUrl}/products/${id}`, body));
        return res.data;
      },
      async () => {
        throw new Error('Product service is temporarily unavailable');
      },
    );
  }

  async forwardBatch(ids: string[]) {
    return this.circuitBreaker.execute(
      'product-service',
      async () => {
        // Fetch multiple products in parallel
        const products = await Promise.all(
          ids.map((id) =>
            firstValueFrom(this.http.get(`${this.productBaseUrl}/products/${id}`))
              .then((res) => res.data)
              .catch((error) => {
                // Return null for failed requests instead of throwing
                console.error(`Failed to fetch product ${id}:`, error.message);
                return null;
              }),
          ),
        );
        // Filter out null values (failed requests)
        return products.filter((p) => p !== null);
      },
      async () => {
        // Fallback: return empty array
        return [];
      },
    );
  }
}


