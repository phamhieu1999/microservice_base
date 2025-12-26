import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PromotionClient {
  private readonly promoBaseUrl = process.env.PROMOTION_SERVICE_URL || 'http://promotion-service:3009';

  constructor(private readonly http: HttpService) {}

  async apply(voucherId: string, userId: string) {
    await firstValueFrom(
      this.http.post(`${this.promoBaseUrl}/vouchers/apply`, {
        voucherId,
        userId,
      }),
    );
  }
}


