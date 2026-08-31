import * as Sentry from '@sentry/react-native';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const prefix = `[MONPRO][${level.toUpperCase()}]`;
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `${prefix} ${message}${contextStr}`;
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (__DEV__) {
      console.debug(formatMessage('debug', message, context));
    }
  },

  info(message: string, context?: LogContext) {
    if (__DEV__) {
      console.info(formatMessage('info', message, context));
    }
  },

  warn(message: string, context?: LogContext) {
    console.warn(formatMessage('warn', message, context));
  },

  error(message: string, context?: LogContext) {
    console.error(formatMessage('error', message, context));
  },

  captureException(error: unknown, context?: LogContext) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error(message, { ...context, stack });

    if (!__DEV__) {
      Sentry.captureException(error, { extra: context });
    }
  },

  captureMessage(message: string, level: LogLevel = 'info', context?: LogContext) {
    logger[level](message, context);

    if (!__DEV__) {
      Sentry.captureMessage(message, level as any);
    }
  },
};
