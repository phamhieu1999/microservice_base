import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CartProxyService {
  private readonly cartBaseUrl = process.env.CART_SERVICE_URL || 'http://cart-service:3006';

  constructor(private readonly http: HttpService) {}

  async getCart(authorization: string) {
    const res = await firstValueFrom(
      this.http.get(`${this.cartBaseUrl}/cart`, {
        headers: { Authorization: authorization },
      }),
    );
    return res.data;
  }

  async upsertItem(authorization: string, body: any) {
    const res = await firstValueFrom(
      this.http.post(`${this.cartBaseUrl}/cart/items`, body, {
        headers: { Authorization: authorization },
      }),
    );
    return res.data;
  }

  async removeItem(authorization: string, productId: string) {
    const res = await firstValueFrom(
      this.http.delete(`${this.cartBaseUrl}/cart/items/${productId}`, {
        headers: { Authorization: authorization },
      }),
    );
    return res.data;
  }
}


