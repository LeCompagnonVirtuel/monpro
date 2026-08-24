import { Logger } from '@nestjs/common';
import { IPaymentProvider, PaymentInitiateRequest, PaymentInitiateResponse, WebhookParseResult } from './payment-provider.interface';
import { v4 as uuid } from 'uuid';

export class DevPaymentProvider implements IPaymentProvider {
  private readonly logger = new Logger('DevPaymentProvider');

  async initiate(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    const providerRef = `DEV_${uuid().slice(0, 8)}`;
    this.logger.warn(`[MOCKED] Payment initiated: ${request.amount} FCFA from ${request.phoneNumber} — ref: ${providerRef}`);
    return {
      providerRef,
      status: 'pending',
      metadata: { mocked: true, initiatedAt: new Date().toISOString() },
    };
  }

  parseWebhook(payload: any): WebhookParseResult {
    return {
      providerRef: payload.reference || payload.providerRef,
      success: payload.status === 'success',
      amount: payload.amount,
    };
  }

  async checkStatus(providerRef: string): Promise<{ status: string }> {
    this.logger.warn(`[MOCKED] Checking status for: ${providerRef}`);
    return { status: 'completed' };
  }
}
