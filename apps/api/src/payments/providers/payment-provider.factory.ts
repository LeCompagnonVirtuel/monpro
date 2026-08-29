import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '@prisma/client';
import { IPaymentProvider } from './payment-provider.interface';
import { DevPaymentProvider } from './dev-payment.provider';

@Injectable()
export class PaymentProviderFactory {
  private readonly logger = new Logger(PaymentProviderFactory.name);
  private providers: Map<PaymentProvider, IPaymentProvider> = new Map();

  constructor(private readonly config: ConfigService) {
    const mode = this.config.get<string>('PAYMENT_MODE', 'dev');
    this.logger.log(`Payment mode: ${mode}`);

    const devProvider = new DevPaymentProvider();
    this.providers.set(PaymentProvider.ORANGE_MONEY, devProvider);
    this.providers.set(PaymentProvider.MTN_MOMO, devProvider);
    this.providers.set(PaymentProvider.MOOV_MONEY, devProvider);
    this.providers.set(PaymentProvider.WAVE, devProvider);

    if (mode !== 'dev') {
      this.logger.warn(`Real payment providers not yet implemented. Using dev fallback for all providers.`);
    }
  }

  getProvider(provider: PaymentProvider): IPaymentProvider {
    const p = this.providers.get(provider);
    if (!p) throw new Error(`Provider ${provider} non configuré`);
    return p;
  }
}
