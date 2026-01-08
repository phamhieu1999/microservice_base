import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { PromotionProxyService } from '../promotion-proxy/promotion-proxy.service';
import { ShippingProxyService } from '../shipping-proxy/shipping-proxy.service';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';

@Injectable()
export class OrderProxyService {
  private readonly orderBaseUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

  constructor(
    private readonly http: HttpService,
    private readonly promotion: PromotionProxyService,
    private readonly shipping: ShippingProxyService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  async forwardCreate(user: any, body: any, authorization?: string) {
    let voucherPayload: { voucherId?: string; discountAmount?: number } = {};
    let shippingPayload: { shippingFee?: number } = {};
    const authHeader = authorization || '';

    if (body.voucherCode && body.items?.length) {
      const validateDto = {
        code: body.voucherCode,
        userId: user.userId || user.sub,
        items: body.items.map((i: any) => ({
          productId: i.productId,
          sellerId: i.sellerId,
          price: i.unitPrice,
          quantity: i.quantity,
        })),
      };
      try {
        const validated = await this.promotion.validate(authHeader, validateDto) as any;
        voucherPayload = {
          voucherId: validated.voucherId,
          discountAmount: validated.discountAmount,
        };
      } catch (error) {
        // Nếu promotion service không available, bỏ qua voucher
        console.warn('Promotion service unavailable, skipping voucher validation:', error);
      }
    }

    if (body.items?.length && body.address) {
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
      try {
        const quoted = await this.shipping.getQuote(quoteDto) as any;
        // Response format: { quotes: [...], totalQuotes: number }
        // Lấy quote đầu tiên (hoặc có thể chọn quote rẻ nhất)
        if (quoted?.quotes && quoted.quotes.length > 0) {
          // Lấy quote đầu tiên hoặc quote có totalFee thấp nhất
          const selectedQuote = quoted.quotes.reduce((min: any, quote: any) => 
            quote.totalFee < min.totalFee ? quote : min
          );
          shippingPayload = { shippingFee: selectedQuote.totalFee };
        } else {
          throw new Error('No quotes available');
        }
      } catch (error) {
        // Nếu shipping service không available, dùng shippingFee từ body hoặc mặc định
        console.warn('Shipping service unavailable, using provided shippingFee:', error);
        if (body.shippingFee) {
          shippingPayload = { shippingFee: body.shippingFee };
        }
      }
    } else if (body.shippingFee) {
      // Nếu không có address nhưng có shippingFee trong body, dùng luôn
      shippingPayload = { shippingFee: body.shippingFee };
    }

    // Loại bỏ các field không cần thiết trước khi gửi sang order-service
    // Order-service không chấp nhận userId trong body, chỉ dùng x-user-id header
    const { voucherCode, accessToken, userId, ...cleanBody } = body;
    const enrichedBody = {
      ...cleanBody,
      items: body.items,
      ...voucherPayload,
      ...shippingPayload,
    };
    
    return this.circuitBreaker.execute(
      'order-service',
      async () => {
        const res = await firstValueFrom(
          this.http.post(`${this.orderBaseUrl}/orders`, enrichedBody, {
            headers: { 'x-user-id': user.userId || user.sub },
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


