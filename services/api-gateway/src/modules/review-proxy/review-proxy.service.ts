import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ReviewProxyService {
  private readonly reviewBaseUrl = process.env.REVIEW_SERVICE_URL || 'http://review-service:3007';

  constructor(private readonly http: HttpService) {}

  async createReview(authorization: string, body: any) {
    const res = await firstValueFrom(
      this.http.post(`${this.reviewBaseUrl}/reviews`, body, {
        headers: { Authorization: authorization },
      }),
    );
    return res.data;
  }

  async listByProduct(productId: string) {
    const res = await firstValueFrom(
      this.http.get(`${this.reviewBaseUrl}/products/${productId}/reviews`),
    );
    return res.data;
  }
}


