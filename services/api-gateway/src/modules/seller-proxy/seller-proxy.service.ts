import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SellerProxyService {
  private readonly sellerBaseUrl = process.env.SELLER_SERVICE_URL || 'http://seller-service:3008';

  constructor(private readonly http: HttpService) {}

  async register(authorization: string, body: any) {
    const res = await firstValueFrom(
      this.http.post(`${this.sellerBaseUrl}/sellers/register`, body, {
        headers: { Authorization: authorization },
      }),
    );
    return res.data;
  }

  async me(authorization: string) {
    const res = await firstValueFrom(
      this.http.get(`${this.sellerBaseUrl}/sellers/me`, {
        headers: { Authorization: authorization },
      }),
    );
    return res.data;
  }

  async getShop(id: string) {
    const res = await firstValueFrom(this.http.get(`${this.sellerBaseUrl}/shops/${id}`));
    return res.data;
  }
}


