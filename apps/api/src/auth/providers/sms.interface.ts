export interface ISmsProvider {
  sendSms(phone: string, message: string): Promise<{ success: boolean; messageId?: string }>;
}

export const SMS_PROVIDER = 'SMS_PROVIDER';
