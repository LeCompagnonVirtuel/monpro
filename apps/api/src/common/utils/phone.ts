const IVORY_COAST_COUNTRY_CODE = '+225';
const MIN_PHONE_LENGTH = 10;
const MAX_PHONE_LENGTH = 15;

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-().]/g, '');

  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.slice(2);
    } else if (cleaned.length === 10 && cleaned.startsWith('0')) {
      cleaned = IVORY_COAST_COUNTRY_CODE + cleaned.slice(1);
    } else if (cleaned.length >= MIN_PHONE_LENGTH && cleaned.length <= MAX_PHONE_LENGTH) {
      cleaned = '+' + cleaned;
    }
  }

  if (!/^\+\d{10,15}$/.test(cleaned)) {
    throw new Error(`Format de téléphone invalide: ${phone}`);
  }

  return cleaned;
}

export function isValidPhone(phone: string): boolean {
  return /^\+\d{10,15}$/.test(phone);
}
