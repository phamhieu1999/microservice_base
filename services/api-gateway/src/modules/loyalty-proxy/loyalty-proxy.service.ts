import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LoyaltyProxyService {
  private readonly loyaltyBaseUrl =
    process.env.LOYALTY_SERVICE_URL || 'http://loyalty-service:3015';

  constructor(private readonly http: HttpService) {}

  getPoints(userId: string) {
    return firstValueFrom(
      this.http.get(`${this.loyaltyBaseUrl}/loyalty/points`, {
        headers: { 'x-user-id': userId },
      }),
    ).then((res) => res.data);
  }

  getHistory(userId: string, limit?: number, skip?: number) {
    return firstValueFrom(
      this.http.get(`${this.loyaltyBaseUrl}/loyalty/history`, {
        headers: { 'x-user-id': userId },
        params: { limit, skip },
      }),
    ).then((res) => res.data);
  }

  redeem(userId: string, body: any) {
    return firstValueFrom(
      this.http.post(`${this.loyaltyBaseUrl}/loyalty/redeem`, body, {
        headers: { 'x-user-id': userId },
      }),
    ).then((res) => res.data);
  }
}


