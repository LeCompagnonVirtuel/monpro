import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

function initSentry() {
  if (!process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    tracesSampleRate: 0.2,
  });
}

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
] as const;

const PRODUCTION_REQUIRED_ENV_VARS = [
  'CORS_ORIGINS',
] as const;

function validateEnvironment(): void {
  const logger = new Logger('EnvValidation');
  const isProduction = process.env.NODE_ENV === 'production';
  const missing: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) missing.push(key);
  }

  if (isProduction) {
    for (const key of PRODUCTION_REQUIRED_ENV_VARS) {
      if (!process.env[key]) missing.push(key);
    }

    if (process.env.OTP_PROVIDER === 'africas_talking') {
      if (!process.env.AFRICAS_TALKING_API_KEY) missing.push('AFRICAS_TALKING_API_KEY (required when OTP_PROVIDER=africas_talking)');
      if (!process.env.AFRICAS_TALKING_USERNAME) missing.push('AFRICAS_TALKING_USERNAME (required when OTP_PROVIDER=africas_talking)');
    }

    if (process.env.PUSH_NOTIFICATION_PROVIDER === 'expo' && !process.env.EXPO_ACCESS_TOKEN) {
      logger.warn('EXPO_ACCESS_TOKEN is not set. Push notifications may fail.');
    }

    if (process.env.PAYMENT_MODE === 'production') {
      logger.warn('PAYMENT_MODE=production but real payment providers are not yet implemented.');
    }

    if (process.env.JWT_SECRET === 'CHANGE_ME_IN_PRODUCTION') {
      logger.fatal('JWT_SECRET is still the default value. Set a secure secret in production.');
      process.exit(1);
    }
  }

  if (missing.length > 0) {
    logger.fatal(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const validNodeEnvs = ['development', 'test', 'production'];
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!validNodeEnvs.includes(nodeEnv)) {
    logger.warn(`Invalid NODE_ENV "${nodeEnv}". Valid values: ${validNodeEnvs.join(', ')}`);
  }

  const validOtpProviders = ['dev', 'africas_talking'];
  const otpProvider = process.env.OTP_PROVIDER || 'dev';
  if (!validOtpProviders.includes(otpProvider)) {
    logger.warn(`Invalid OTP_PROVIDER "${otpProvider}". Valid values: ${validOtpProviders.join(', ')}`);
  }

  const validPushProviders = ['dev', 'expo'];
  const pushProvider = process.env.PUSH_NOTIFICATION_PROVIDER || 'dev';
  if (!validPushProviders.includes(pushProvider)) {
    logger.warn(`Invalid PUSH_NOTIFICATION_PROVIDER "${pushProvider}". Valid values: ${validPushProviders.join(', ')}`);
  }

  const validPaymentModes = ['dev', 'production'];
  const paymentMode = process.env.PAYMENT_MODE || 'dev';
  if (!validPaymentModes.includes(paymentMode)) {
    logger.warn(`Invalid PAYMENT_MODE "${paymentMode}". Valid values: ${validPaymentModes.join(', ')}`);
  }
}

async function bootstrap() {
  initSentry();
  validateEnvironment();

  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: isProduction ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug'],
  });

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || (isProduction ? [] : ['http://localhost:3000', 'http://localhost:8081']),
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new TimeoutInterceptor(30000));

  app.enableShutdownHooks();

  if (!isProduction && (process.env.STORAGE_PROVIDER === 'local' || !process.env.STORAGE_PROVIDER)) {
    const { static: serveStatic } = await import('express');
    app.use('/uploads', serveStatic('uploads'));
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MONPRO API')
    .setDescription('Marketplace de services professionnels — Côte d\'Ivoire')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentification OTP')
    .addTag('Users', 'Gestion des utilisateurs')
    .addTag('Professionals', 'Professionnels et matching')
    .addTag('Categories', 'Catégories de services')
    .addTag('Services', 'Services disponibles')
    .addTag('Service Requests', 'Demandes de service')
    .addTag('Quotes', 'Devis')
    .addTag('Bookings', 'Réservations')
    .addTag('Payments', 'Paiements')
    .addTag('Reviews', 'Avis et notations')
    .addTag('Messaging', 'Messagerie')
    .addTag('Notifications', 'Notifications')
    .addTag('Favorites', 'Favoris')
    .addTag('Geography', 'Géographie (pays, villes, communes)')
    .addTag('Uploads', 'Upload de fichiers')
    .addTag('Admin', 'Administration')
    .addTag('Ledger', 'Registre financier')
    .addTag('Interventions', 'Interventions')
    .addTag('Businesses', 'Entreprises')
    .addTag('Device Tokens', 'Tokens push')
    .addTag('Disputes & Reports', 'Litiges et signalements')
    .addTag('Health', 'Santé du serveur')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  if (!isProduction) {
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger docs enabled at /api/docs');
  }

  app.getHttpAdapter().get('/api/openapi.json', (_req, res) => {
    if (isProduction && !process.env.SWAGGER_EXPOSED) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    res.json(document);
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`MONPRO API running on port ${port} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  logger.log(`Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap();
