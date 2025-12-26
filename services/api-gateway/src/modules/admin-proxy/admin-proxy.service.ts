import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AdminProxyService {
  private readonly disputeBaseUrl = process.env.DISPUTE_SERVICE_URL || 'http://dispute-service:3016';
  private readonly settlementBaseUrl =
    process.env.SETTLEMENT_SERVICE_URL || 'http://settlement-service:3017';

  constructor(private readonly http: HttpService) {}

  getDispute(id: string) {
    return firstValueFrom(this.http.get(`${this.disputeBaseUrl}/disputes/${id}`)).then(
      (res) => res.data,
    );
  }

  listDisputes(params: { status?: string; sellerId?: string; userId?: string; page?: number; limit?: number }) {
    return firstValueFrom(
      this.http.get(`${this.disputeBaseUrl}/disputes`, {
        params,
      }),
    ).then((res) => res.data);
  }

  getSellerBalance(sellerId: string) {
    return firstValueFrom(
      this.http.get(`${this.settlementBaseUrl}/settlements/seller/${sellerId}/summary`),
    ).then((res) => res.data);
  }

  listSellerPayouts(sellerId: string, query?: { status?: string; page?: number; limit?: number }) {
    return firstValueFrom(
      this.http.get(`${this.settlementBaseUrl}/settlements/seller/${sellerId}/payouts`, {
        params: query,
      }),
    ).then((res) => res.data);
  }
}
