import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISmsProvider } from './sms.interface';

const SMS_TIMEOUT_MS = 10_000;

@Injectable()
export class AfricaSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(AfricaSmsProvider.name);
  private readonly apiKey: string;
  private readonly username: string;
  private readonly from: string | undefined;
  private readonly environment: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('AFRICAS_TALKING_API_KEY') || '';
    this.username = this.config.get<string>('AFRICAS_TALKING_USERNAME') || 'sandbox';
    this.from = this.config.get<string>('AFRICAS_TALKING_SENDER_ID') || undefined;
    this.environment = this.config.get<string>('AFRICAS_TALKING_ENVIRONMENT') || 'sandbox';

    if (!this.apiKey) {
      const nodeEnv = this.config.get<string>('NODE_ENV');
      if (nodeEnv === 'production') {
        throw new Error(
          'FATAL: AFRICASTALKING_API_KEY is required in production. ' +
          'Set the environment variable and restart the application.',
        );
      }
      this.logger.warn('AFRICAS_TALKING_API_KEY is not set. SMS will fail in production.');
    }

    this.logger.log(`SMS provider initialized: africas_talking (env: ${this.environment})`);
  }

  async sendSms(phone: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    const body = new URLSearchParams();
    body.append('username', this.username);
    body.append('to', phone);
    body.append('message', message);
    if (this.from) {
      body.append('from', this.from);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SMS_TIMEOUT_MS);

      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': this.apiKey,
          'Accept': 'application/json',
        },
        body: body.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Africa's Talking SMS failed [${response.status}]: status=${response.status}`);
        throw new Error('SMS delivery failed. Please try again.');
      }

      const data = await response.json() as {
        SMSMessageData?: {
          Recipients?: Array<{ status: string; messageId?: string; number: string }>;
        };
      };

      const recipients = data.SMSMessageData?.Recipients || [];
      const firstRecipient = recipients[0];

      if (firstRecipient?.status === 'Success') {
        this.logger.log(`SMS sent successfully to ${phone}`);
        return { success: true, messageId: firstRecipient.messageId };
      }

      this.logger.error(`SMS delivery failed for ${phone}: status=${firstRecipient?.status || 'unknown'}`);
      throw new Error('SMS delivery failed. Please try again.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error(`SMS request timed out after ${SMS_TIMEOUT_MS}ms for ${phone}`);
        throw new Error('SMS delivery timed out. Please try again.');
      }
      throw error;
    }
  }
}
