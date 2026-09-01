import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '@prisma/client';
import { IPaymentProvider } from './payment-provider.interface';
import { DevPaymentProvider } from './dev-payment.provider';
import { OrangeMoneyProvider } from './orange-money.provider';
import { MtnMomoProvider } from './mtn-momo.provider';
import { MoovMoneyProvider } from './moov-money.provider';
import { WaveProvider } from './wave.provider';

@Injectable()
export class PaymentProviderFactory {
  private readonly logger = new Logger(PaymentProviderFactory.name);
  private providers: Map<PaymentProvider, IPaymentProvider> = new Map();

  constructor(private readonly config: ConfigService) {
    const mode = this.config.get<string>('PAYMENT_MODE', 'dev');
    this.logger.log(`Payment mode: ${mode}`);

    if (mode === 'live') {
      this.logger.log('Loading real payment providers');
      this.providers.set(PaymentProvider.ORANGE_MONEY, new OrangeMoneyProvider(config));
      this.providers.set(PaymentProvider.MTN_MOMO, new MtnMomoProvider(config));
      this.providers.set(PaymentProvider.MOOV_MONEY, new MoovMoneyProvider(config));
      this.providers.set(PaymentProvider.WAVE, new WaveProvider(config));
    } else {
      this.logger.warn('Using dev payment providers — no real transactions');
      const devProvider = new DevPaymentProvider();
      this.providers.set(PaymentProvider.ORANGE_MONEY, devProvider);
      this.providers.set(PaymentProvider.MTN_MOMO, devProvider);
      this.providers.set(PaymentProvider.MOOV_MONEY, devProvider);
      this.providers.set(PaymentProvider.WAVE, devProvider);
    }
  }

  getProvider(provider: PaymentProvider): IPaymentProvider {
    const p = this.providers.get(provider);
    if (!p) throw new Error(`Provider ${provider} non configuré`);
    return p;
  }
}
