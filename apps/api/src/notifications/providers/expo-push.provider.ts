import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPushNotificationProvider, PushMessage, PushResult } from './push-notification.interface';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_URL = 'https://exp.host/--/api/v2/push/send';
const PUSH_TIMEOUT_MS = 10_000;
const MAX_BATCH_SIZE = 100;

@Injectable()
export class ExpoPushProvider implements IPushNotificationProvider {
  private readonly logger = new Logger(ExpoPushProvider.name);
  private readonly accessToken: string;

  constructor(private readonly config: ConfigService) {
    this.accessToken = this.config.get<string>('EXPO_ACCESS_TOKEN') || '';
    if (!this.accessToken) {
      this.logger.warn('EXPO_ACCESS_TOKEN is not set. Push notifications may fail in production.');
    }
  }

  async send(messages: PushMessage[]): Promise<PushResult[]> {
    const results: PushResult[] = [];

    for (let i = 0; i < messages.length; i += MAX_BATCH_SIZE) {
      const batch = messages.slice(i, i + MAX_BATCH_SIZE);
      const batchResults = await this.sendBatch(batch);
      results.push(...batchResults);
    }

    return results;
  }

  private async sendBatch(messages: PushMessage[]): Promise<PushResult[]> {
    const payloads = messages.map((msg) => ({
      to: msg.token,
      title: msg.title,
      body: msg.body,
      data: msg.data || {},
      sound: 'default',
    }));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PUSH_TIMEOUT_MS);

      const response = await fetch(EXPO_BATCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.accessToken ? { 'Authorization': `Bearer ${this.accessToken}` } : {}),
        },
        body: JSON.stringify(payloads),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Expo push batch failed [${response.status}]: ${errorText}`);
        return messages.map((msg) => ({
          success: false,
          token: msg.token,
          error: `Provider error: ${response.status}`,
        }));
      }

      const data = await response.json() as {
        data?: Array<{ status: string; id?: string; message?: string; error?: string }>;
      };

      if (!data.data) {
        this.logger.error('Expo push returned unexpected response structure');
        return messages.map((msg) => ({
          success: false,
          token: msg.token,
          error: 'Unexpected provider response',
        }));
      }

      return data.data.map((item, index) => ({
        success: item.status === 'ok',
        token: messages[index].token,
        error: item.status !== 'ok' ? item.error || item.message || 'Push failed' : undefined,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Expo push network error: ${message}`);
      return messages.map((msg) => ({
        success: false,
        token: msg.token,
        error: `Network error: ${message}`,
      }));
    }
  }
}
