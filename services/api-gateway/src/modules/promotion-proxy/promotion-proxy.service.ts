import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PromotionProxyService {
  private readonly promoBaseUrl =
    process.env.PROMOTION_SERVICE_URL || 'http://promotion-service:3009';

  constructor(private readonly http: HttpService) {}

  async validate(authorization: string, body: any) {
    const res = await firstValueFrom(
      this.http.post(`${this.promoBaseUrl}/vouchers/validate`, body, {
        headers: { Authorization: authorization },
      }),
    );
    return res.data;
  }

  async apply(authorization: string, body: any) {
    const res = await firstValueFrom(
      this.http.post(`${this.promoBaseUrl}/vouchers/apply`, body, {
        headers: { Authorization: authorization },
      }),
    );
    return res.data;
  }
}


