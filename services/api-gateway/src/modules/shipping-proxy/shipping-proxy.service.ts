import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ShippingProxyService {
  private readonly shippingBaseUrl =
    process.env.SHIPPING_SERVICE_URL || 'http://shipping-service:3010';

  constructor(private readonly http: HttpService) {}

  async quote(authorization: string, body: any) {
    const res = await firstValueFrom(
      this.http.post(`${this.shippingBaseUrl}/shipping/quote`, body, {
        headers: { Authorization: authorization },
      }),
    );
    return res.data;
  }
}


