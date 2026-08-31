import * as Sentry from '@sentry/react-native';
import { ENV } from './env';

export function initSentry() {
  if (__DEV__ || !ENV.SENTRY_DSN) return;

  Sentry.init({
    dsn: ENV.SENTRY_DSN,
    environment: ENV.SENTRY_ENVIRONMENT || 'development',
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    attachStacktrace: true,
  });
}
