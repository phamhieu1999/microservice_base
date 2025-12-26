import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { PromotionProxyService } from '../promotion-proxy/promotion-proxy.service';
import { ShippingProxyService } from '../shipping-proxy/shipping-proxy.service';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';

@Injectable()
export class OrderProxyService {
  private readonly orderBaseUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';

  constructor(
    private readonly http: HttpService,
    private readonly promotion: PromotionProxyService,
    private readonly shipping: ShippingProxyService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  async forwardCreate(user: any, body: any) {
    let voucherPayload: { voucherId?: string; discountAmount?: number } = {};
    let shippingPayload: { shippingFee?: number } = {};

    if (body.voucherCode && body.items?.length) {
      const validateDto = {
        code: body.voucherCode,
        userId: user.userId,
        items: body.items.map((i: any) => ({
          productId: i.productId,
          sellerId: i.sellerId,
          price: i.unitPrice,
          quantity: i.quantity,
        })),
      };
      const validated = await this.promotion.validate(`Bearer ${body.accessToken || ''}`, validateDto);
      voucherPayload = {
        voucherId: validated.voucherId,
        discountAmount: validated.discountAmount,
      };
    }

    if (body.items?.length) {
      const quoteDto = {
        address: body.address,
        items: body.items.map((i: any) => ({
          productId: i.productId,
          sellerId: i.sellerId,
          price: i.unitPrice,
          quantity: i.quantity,
          weight: i.weight,
        })),
      };
      const quoted = await this.shipping.quote(`Bearer ${body.accessToken || ''}`, quoteDto);
      shippingPayload = { shippingFee: quoted.totalShippingFee };
    }

    const enrichedBody = { ...body, userId: user.userId, ...voucherPayload, ...shippingPayload };
    
    return this.circuitBreaker.execute(
      'order-service',
      async () => {
        const res = await firstValueFrom(
          this.http.post(`${this.orderBaseUrl}/orders`, enrichedBody, {
            headers: { 'x-user-id': user.userId },
          }),
        );
        return res.data;
      },
      async () => {
        throw new Error('Order service is temporarily unavailable');
      },
    );
  }

  async forwardGet(id: string) {
    return this.circuitBreaker.execute(
      'order-service',
      async () => {
        const res = await firstValueFrom(this.http.get(`${this.orderBaseUrl}/orders/${id}`));
        return res.data;
      },
      async () => {
        throw new Error('Order service is temporarily unavailable');
      },
    );
  }
}


