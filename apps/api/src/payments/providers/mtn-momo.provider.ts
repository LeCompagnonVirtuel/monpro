import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentProvider, PaymentInitiateRequest, PaymentInitiateResponse, WebhookParseResult } from './payment-provider.interface';
import * as crypto from 'crypto';

@Injectable()
export class MtnMomoProvider implements IPaymentProvider {
  private readonly logger = new Logger(MtnMomoProvider.name);
  private readonly apiUrl: string;
  private readonly subscriptionKey: string;
  private readonly apiKey: string;
  private readonly userId: string;

  constructor(private readonly config: ConfigService) {
    this.apiUrl = this.config.get<string>('MTN_MOMO_API_URL', 'https://sandbox.momodeveloper.mtn.com');
    this.subscriptionKey = this.config.get<string>('MTN_MOMO_SUBSCRIPTION_KEY', '');
    this.apiKey = this.config.get<string>('MTN_MOMO_API_KEY', '');
    this.userId = this.config.get<string>('MTN_MOMO_USER_ID', '');
  }

  private async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(`${this.userId}:${this.apiKey}`).toString('base64');

    const response = await fetch(`${this.apiUrl}/collection/token/`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      },
    });

    if (!response.ok) {
      throw new Error(`MTN MoMo token error: ${response.status}`);
    }

    const data = await response.json() as { access_token: string };
    return data.access_token;
  }

  async initiate(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    const accessToken = await this.getAccessToken();
    const referenceId = crypto.randomUUID();

    const body = {
      amount: request.amount.toString(),
      currency: 'XOF',
      externalId: request.reference,
      payer: { partyIdType: 'MSISDN', partyId: request.phoneNumber.replace('+', '') },
      payerMessage: request.description,
      payeeNote: `MONPRO Payment ${request.reference}`,
    };

    this.logger.log(`MTN MoMo initiate: ${request.amount} XOF for ${request.phoneNumber}`);

    const response = await fetch(`${this.apiUrl}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': this.config.get<string>('MTN_MOMO_ENV', 'sandbox'),
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok && response.status !== 202) {
      const error = await response.text();
      this.logger.error(`MTN MoMo API error: ${response.status} - ${error}`);
      throw new Error(`MTN MoMo API error: ${response.status}`);
    }

    return {
      providerRef: referenceId,
      status: 'pending',
      metadata: { externalId: request.reference },
    };
  }

  verifyWebhookSignature(payload: any, signature: string | undefined): boolean {
    if (!signature) return false;

    const webhookSecret = this.config.get<string>('MTN_MOMO_WEBHOOK_SECRET', '');
    if (!webhookSecret) {
      this.logger.warn('MTN MoMo webhook secret not configured');
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
      SUCCESSFUL: true,
      FAILED: false,
      REJECTED: false,
      TIMEOUT: false,
    };

    return {
      providerRef: payload.externalId || payload.financialTransactionId,
      success: statusMap[payload.status] ?? false,
      amount: payload.amount ? parseFloat(payload.amount) : undefined,
      metadata: { status: payload.status, reason: payload.reason },
    };
  }

  async checkStatus(providerRef: string): Promise<{ status: string }> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.apiUrl}/collection/v1_0/requesttopay/${providerRef}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Target-Environment': this.config.get<string>('MTN_MOMO_ENV', 'sandbox'),
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      },
    });

    if (!response.ok) {
      this.logger.error(`MTN MoMo status check failed: ${response.status}`);
      return { status: 'UNKNOWN' };
    }

    const data = await response.json() as { status: string };
    return { status: data.status };
  }
}
