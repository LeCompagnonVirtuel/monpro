import { Injectable, Logger } from '@nestjs/common';
import { IPushNotificationProvider, PushMessage, PushResult } from './push-notification.interface';

@Injectable()
export class DevPushProvider implements IPushNotificationProvider {
  private readonly logger = new Logger(DevPushProvider.name);

  async send(messages: PushMessage[]): Promise<PushResult[]> {
    return messages.map((msg) => {
      this.logger.log(`[DEV PUSH] → ${msg.token}: ${msg.title} — ${msg.body}`);
      return { success: true, token: msg.token };
    });
  }
}
