import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private config: ConfigService) {}

  async generate(phone: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const provider = this.config.get<string>('OTP_PROVIDER', 'dev');

    if (provider === 'dev') {
      this.logger.log(`[DEV] OTP for ${phone}: ${code}`);
      return code;
    }

    // REQUIRES_EXTERNAL_CONFIGURATION: SMS provider (e.g., Twilio, Africa's Talking)
    await this.sendSms(phone, `Votre code MONPRO: ${code}`);
    return code;
  }

  private async sendSms(phone: string, message: string): Promise<void> {
    // Adapter pattern — implement concrete SMS provider here
    this.logger.warn(`SMS sending not configured. Message: ${message} to ${phone}`);
  }
}
