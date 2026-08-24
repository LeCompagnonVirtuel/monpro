import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8081'],
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

  // Serve uploaded files statically in dev
  if (process.env.STORAGE_PROVIDER === 'local' || !process.env.STORAGE_PROVIDER) {
    const express = await import('express');
    app.use('/uploads', express.default.static('uploads'));
  }

  const config = new DocumentBuilder()
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
    .addTag('Disputes & Reports', 'Litiges et signalements')
    .addTag('Health', 'Santé du serveur')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`MONPRO API running on port ${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
  logger.log(`Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap();
