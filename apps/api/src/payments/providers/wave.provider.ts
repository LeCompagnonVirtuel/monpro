import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentProvider, PaymentInitiateRequest, PaymentInitiateResponse, WebhookParseResult } from './payment-provider.interface';
import * as crypto from 'crypto';

@Injectable()
export class WaveProvider implements IPaymentProvider {
  private readonly logger = new Logger(WaveProvider.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiUrl = this.config.get<string>('WAVE_API_URL', 'https://api.wave.com/v1');
    this.apiKey = this.config.get<string>('WAVE_API_KEY', '');
  }

  async initiate(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    const body = {
      amount: request.amount,
      currency: 'XOF',
      phone: request.phoneNumber.replace('+', ''),
      name: 'MONPRO',
      description: request.description,
      callback_url: request.description,
    };

    this.logger.log(`Wave initiate: ${request.amount} XOF for ${request.phoneNumber}`);

    const response = await fetch(`${this.apiUrl}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Wave API error: ${response.status} - ${error}`);
      throw new Error(`Wave API error: ${response.status}`);
    }

    const data = await response.json() as { id: string; payment_url: string };

    return {
      providerRef: data.id,
      status: 'pending',
      redirectUrl: data.payment_url,
      metadata: {},
    };
  }

  verifyWebhookSignature(payload: any, signature: string | undefined): boolean {
    if (!signature) return false;

    const webhookSecret = this.config.get<string>('WAVE_WEBHOOK_SECRET', '');
    if (!webhookSecret) {
      this.logger.warn('Wave webhook secret not configured');
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
      completed: true,
      successful: true,
      failed: false,
      cancelled: false,
      expired: false,
    };

    return {
      providerRef: payload.id || payload.session_id,
      success: statusMap[payload.status] ?? false,
      amount: payload.amount,
      metadata: { status: payload.status },
    };
  }

  async checkStatus(providerRef: string): Promise<{ status: string }> {
    const response = await fetch(`${this.apiUrl}/checkout/sessions/${providerRef}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      this.logger.error(`Wave status check failed: ${response.status}`);
      return { status: 'UNKNOWN' };
    }

    const data = await response.json() as { status: string };
    return { status: data.status };
  }
}
