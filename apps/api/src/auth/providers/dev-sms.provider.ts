import { Injectable, Logger } from '@nestjs/common';
import { ISmsProvider } from './sms.interface';

@Injectable()
export class DevSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(DevSmsProvider.name);

  async sendSms(phone: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    this.logger.log(`[DEV SMS] → ${phone}: ${message}`);
    return { success: true, messageId: `dev-${Date.now()}` };
  }
}
