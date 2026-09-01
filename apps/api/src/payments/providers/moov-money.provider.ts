import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentProvider, PaymentInitiateRequest, PaymentInitiateResponse, WebhookParseResult } from './payment-provider.interface';
import * as crypto from 'crypto';

@Injectable()
export class MoovMoneyProvider implements IPaymentProvider {
  private readonly logger = new Logger(MoovMoneyProvider.name);
  private readonly apiUrl: string;
  private readonly merchantId: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiUrl = this.config.get<string>('MOOV_MONEY_API_URL', 'https://api.moov.bf/v1');
    this.merchantId = this.config.get<string>('MOOV_MONEY_MERCHANT_ID', '');
    this.apiKey = this.config.get<string>('MOOV_MONEY_API_KEY', '');
  }

  async initiate(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    const body = {
      merchantId: this.merchantId,
      amount: request.amount,
      currency: 'XOF',
      orderId: request.reference,
      phone: request.phoneNumber.replace('+', ''),
      description: request.description,
    };

    this.logger.log(`Moov Money initiate: ${request.amount} XOF for ${request.phoneNumber}`);

    const response = await fetch(`${this.apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Moov Money API error: ${response.status} - ${error}`);
      throw new Error(`Moov Money API error: ${response.status}`);
    }

    const data = await response.json() as { transactionId: string; redirectUrl?: string };

    return {
      providerRef: data.transactionId,
      status: 'pending',
      redirectUrl: data.redirectUrl,
      metadata: { orderId: request.reference },
    };
  }

  verifyWebhookSignature(payload: any, signature: string | undefined): boolean {
    if (!signature) return false;

    const webhookSecret = this.config.get<string>('MOOV_MONEY_WEBHOOK_SECRET', '');
    if (!webhookSecret) {
      this.logger.warn('Moov Money webhook secret not configured');
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
      COMPLETED: true,
      FAILED: false,
      CANCELLED: false,
      EXPIRED: false,
    };

    return {
      providerRef: payload.transactionId || payload.orderId,
      success: statusMap[payload.status] ?? false,
      amount: payload.amount,
      metadata: { status: payload.status },
    };
  }

  async checkStatus(providerRef: string): Promise<{ status: string }> {
    const response = await fetch(`${this.apiUrl}/payments/${providerRef}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      this.logger.error(`Moov Money status check failed: ${response.status}`);
      return { status: 'UNKNOWN' };
    }

    const data = await response.json() as { status: string };
    return { status: data.status };
  }
}
