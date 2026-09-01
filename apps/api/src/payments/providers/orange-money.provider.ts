import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentProvider, PaymentInitiateRequest, PaymentInitiateResponse, WebhookParseResult } from './payment-provider.interface';
import * as crypto from 'crypto';

@Injectable()
export class OrangeMoneyProvider implements IPaymentProvider {
  private readonly logger = new Logger(OrangeMoneyProvider.name);
  private readonly apiUrl: string;
  private readonly merchantKey: string;
  private readonly apiSecret: string;
  private readonly accessToken: string;

  constructor(private readonly config: ConfigService) {
    this.apiUrl = this.config.get<string>('ORANGE_MONEY_API_URL', 'https://api.orange.com/orange-money-webpay/dev/v1');
    this.merchantKey = this.config.get<string>('ORANGE_MONEY_MERCHANT_KEY', '');
    this.apiSecret = this.config.get<string>('ORANGE_MONEY_API_SECRET', '');
    this.accessToken = this.config.get<string>('ORANGE_MONEY_ACCESS_TOKEN', '');
  }

  async initiate(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    const body = {
      merchant_key: this.merchantKey,
      currency: 'OUV',
      order_id: request.reference,
      amount: request.amount,
      return_url: request.description,
      cancel_url: request.description,
      notif_url: request.description,
      lang: 'fr',
    };

    this.logger.log(`Orange Money initiate: ${request.amount} XOF for ${request.phoneNumber}`);

    const response = await fetch(`${this.apiUrl}/webpayment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Orange Money API error: ${response.status} - ${error}`);
      throw new Error(`Orange Money API error: ${response.status}`);
    }

    const data = await response.json() as { pay_token: string; payment_url: string; notif_token: string };

    return {
      providerRef: data.pay_token,
      status: 'pending',
      redirectUrl: data.payment_url,
      metadata: { notif_token: data.notif_token },
    };
  }

  verifyWebhookSignature(payload: any, signature: string | undefined): boolean {
    if (!signature) return false;

    const webhookSecret = this.config.get<string>('ORANGE_MONEY_WEBHOOK_SECRET', '');
    if (!webhookSecret) {
      this.logger.warn('Orange Money webhook secret not configured');
      return false;
    }

    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature),
    );
  }

  parseWebhook(payload: any): WebhookParseResult {
    const statusMap: Record<string, boolean> = {
      SUCCESS: true,
      FAILED: false,
      CANCELLED: false,
      EXPIRED: false,
    };

    return {
      providerRef: payload.pay_token || payload.order_id,
      success: statusMap[payload.status] ?? false,
      amount: payload.amount,
      metadata: { status: payload.status },
    };
  }

  async checkStatus(providerRef: string): Promise<{ status: string }> {
    const response = await fetch(`${this.apiUrl}/webpayment/${providerRef}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      this.logger.error(`Orange Money status check failed: ${response.status}`);
      return { status: 'UNKNOWN' };
    }

    const data = await response.json() as { status: string };
    return { status: data.status };
  }
}
