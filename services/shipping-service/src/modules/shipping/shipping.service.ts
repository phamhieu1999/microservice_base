import { Injectable } from '@nestjs/common';
import { ShippingQuoteDto } from './dto/shipping-quote.dto';

@Injectable()
export class ShippingService {
  async quote(dto: ShippingQuoteDto) {
    const feesBySeller: Record<string, number> = {};

    for (const item of dto.items) {
      const sellerId = item.sellerId || 'default';
      const base = 15000; // base fee
      const perItem = 2000 * item.quantity;
      const current = feesBySeller[sellerId] || 0;
      feesBySeller[sellerId] = current + base + perItem;
    }

    const breakdown = Object.entries(feesBySeller).map(([sellerId, fee]) => ({
      sellerId,
      fee,
    }));

    const totalShippingFee = breakdown.reduce((s, b) => s + b.fee, 0);

    return {
      totalShippingFee,
      breakdown,
    };
  }
}


