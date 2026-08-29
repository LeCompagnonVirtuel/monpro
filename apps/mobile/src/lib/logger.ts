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
      // eslint-disable-next-line no-console
      console.debug(formatMessage('debug', message, context));
    }
  },

  info(message: string, context?: LogContext) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.info(formatMessage('info', message, context));
    }
  },

  warn(message: string, context?: LogContext) {
    // eslint-disable-next-line no-console
    console.warn(formatMessage('warn', message, context));
  },

  error(message: string, context?: LogContext) {
    // eslint-disable-next-line no-console
    console.error(formatMessage('error', message, context));
  },

  captureException(error: unknown, context?: LogContext) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error(message, { ...context, stack });

    // Future: hook into Sentry/Crashlytics here
    // if (sentryEnabled) Sentry.captureException(error, { extra: context });
  },

  captureMessage(message: string, level: LogLevel = 'info', context?: LogContext) {
    logger[level](message, context);

    // Future: hook into Sentry/Crashlytics here
    // if (sentryEnabled) Sentry.captureMessage(message, level);
  },
};
