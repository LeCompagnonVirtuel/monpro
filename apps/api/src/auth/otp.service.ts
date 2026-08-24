import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { ISmsProvider, SMS_PROVIDER } from './providers/sms.interface';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(@Inject(SMS_PROVIDER) private smsProvider: ISmsProvider) {}

  async generate(phone: string): Promise<{ code: string; hash: string }> {
    const code = randomInt(100000, 999999).toString();
    const hash = await bcrypt.hash(code, 10);

    await this.smsProvider.sendSms(phone, `Votre code MONPRO: ${code}`);

    return { code, hash };
  }

  async verify(plainCode: string, hashedCode: string): Promise<boolean> {
    return bcrypt.compare(plainCode, hashedCode);
  }
}
