import { Injectable } from '@nestjs/common';
import { IPaymentProvider } from './payment-provider.interface';
import { MockProvider } from './mock.provider';
import { VNPayProvider } from './vnpay.provider';
import { PaymentProvider } from '../../database/entities/payment.entity';

@Injectable()
export class PaymentProviderFactory {
  constructor(
    private readonly mockProvider: MockProvider,
    private readonly vnpayProvider: VNPayProvider,
  ) {}

  getProvider(provider: PaymentProvider): IPaymentProvider {
    switch (provider) {
      case 'VNPAY':
        return this.vnpayProvider;
      case 'MOCK':
      default:
        return this.mockProvider;
    }
  }
}

