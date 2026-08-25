import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

async function bootstrap() {
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
    res.json(document);
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`MONPRO API running on port ${port} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  logger.log(`Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap();
