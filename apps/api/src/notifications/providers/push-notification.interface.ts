export interface PushMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushResult {
  success: boolean;
  token: string;
  error?: string;
}

export interface IPushNotificationProvider {
  send(messages: PushMessage[]): Promise<PushResult[]>;
}

export const PUSH_NOTIFICATION_PROVIDER = 'PUSH_NOTIFICATION_PROVIDER';
