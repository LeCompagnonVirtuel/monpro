export interface PaymentInitiateRequest {
  amount: number;
  phoneNumber: string;
  reference: string;
  description: string;
}

export interface PaymentInitiateResponse {
  providerRef: string;
  status: string;
  redirectUrl?: string;
  metadata?: any;
}

export interface WebhookParseResult {
  providerRef: string;
  success: boolean;
  amount?: number;
  metadata?: any;
}

export interface IPaymentProvider {
  initiate(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse>;
  parseWebhook(payload: any): WebhookParseResult;
  checkStatus(providerRef: string): Promise<{ status: string }>;
}
