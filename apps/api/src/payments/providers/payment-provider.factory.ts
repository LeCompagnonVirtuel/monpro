import { Injectable } from '@nestjs/common';
import { PaymentProvider } from '@prisma/client';
import { IPaymentProvider } from './payment-provider.interface';
import { DevPaymentProvider } from './dev-payment.provider';

@Injectable()
export class PaymentProviderFactory {
  private providers: Map<PaymentProvider, IPaymentProvider> = new Map();

  constructor() {
    const devProvider = new DevPaymentProvider();
    this.providers.set(PaymentProvider.ORANGE_MONEY, devProvider);
    this.providers.set(PaymentProvider.MTN_MOMO, devProvider);
    this.providers.set(PaymentProvider.MOOV_MONEY, devProvider);
    this.providers.set(PaymentProvider.WAVE, devProvider);
  }

  getProvider(provider: PaymentProvider): IPaymentProvider {
    const p = this.providers.get(provider);
    if (!p) throw new Error(`Provider ${provider} non configuré`);
    return p;
  }
}
