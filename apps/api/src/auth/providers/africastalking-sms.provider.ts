import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISmsProvider } from './sms.interface';

@Injectable()
export class AfricaSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(AfricaSmsProvider.name);
  private readonly apiKey: string;
  private readonly username: string;
  private readonly from: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('AFRICAS_TALKING_API_KEY') || '';
    this.username = this.config.get<string>('AFRICAS_TALKING_USERNAME') || 'sandbox';
    this.from = this.config.get<string>('AFRICAS_TALKING_SENDER_ID') || undefined;

    if (!this.apiKey) {
      const nodeEnv = this.config.get<string>('NODE_ENV');
      if (nodeEnv === 'production') {
        throw new Error(
          'FATAL: AFRICAS_TALKING_API_KEY is required in production. ' +
          'Set the environment variable and restart the application.',
        );
      }
      this.logger.warn('AFRICAS_TALKING_API_KEY is not set. SMS will fail in production.');
    }
  }

  async sendSms(phone: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    const body = new URLSearchParams();
    body.append('username', this.username);
    body.append('to', phone);
    body.append('message', message);
    if (this.from) {
      body.append('from', this.from);
    }

    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': this.apiKey,
        'Accept': 'application/json',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Africa's Talking SMS failed [${response.status}]: ${errorText}`);
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
      this.logger.log(`SMS sent to ${phone} [${firstRecipient.messageId}]`);
      return { success: true, messageId: firstRecipient.messageId };
    }

    this.logger.error(`SMS delivery failed for ${phone}: ${JSON.stringify(data)}`);
    throw new Error('SMS delivery failed. Please try again.');
  }
}
