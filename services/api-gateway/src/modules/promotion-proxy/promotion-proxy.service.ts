import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';

@Injectable()
export class PromotionProxyService {
  private readonly promoBaseUrl =
    process.env.PROMOTION_SERVICE_URL || 'http://localhost:3009';

  constructor(
    private readonly http: HttpService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  async validate(authorization: string, body: any) {
    return this.circuitBreaker.execute(
      'promotion-service',
      async () => {
        const res = await firstValueFrom(
          this.http.post(`${this.promoBaseUrl}/vouchers/validate`, body, {
            headers: { Authorization: authorization },
          }),
        );
        return res.data;
      },
      async () => {
        throw new Error('Promotion service is temporarily unavailable');
      },
    );
  }

  async apply(authorization: string, body: any) {
    return this.circuitBreaker.execute(
      'promotion-service',
      async () => {
        const res = await firstValueFrom(
          this.http.post(`${this.promoBaseUrl}/vouchers/apply`, body, {
            headers: { Authorization: authorization },
          }),
        );
        return res.data;
      },
      async () => {
        throw new Error('Promotion service is temporarily unavailable');
      },
    );
  }

  async exchangeLoyaltyVoucher(authorization: string, userId: string, points: number) {
    return this.circuitBreaker.execute(
      'promotion-service',
      async () => {
        const res = await firstValueFrom(
          this.http.post(
            `${this.promoBaseUrl}/loyalty-vouchers/exchange`,
            { userId, points },
            {
              headers: { Authorization: authorization },
            },
          ),
        );
        return res.data;
      },
      async () => {
        throw new Error('Promotion service is temporarily unavailable');
      },
    );
  }
}


