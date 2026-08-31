import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { CategoriesModule } from './categories/categories.module';
import { ServicesModule } from './services/services.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { QuotesModule } from './quotes/quotes.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FavoritesModule } from './favorites/favorites.module';
import { GeographyModule } from './geography/geography.module';
import { UploadsModule } from './uploads/uploads.module';
import { AdminModule } from './admin/admin.module';
import { LedgerModule } from './ledger/ledger.module';
import { InterventionsModule } from './interventions/interventions.module';
import { DeviceTokensModule } from './device-tokens/device-tokens.module';
import { BusinessesModule } from './businesses/businesses.module';
import { KycModule } from './kyc/kyc.module';
import { RealtimeModule } from './realtime/realtime.module';
import { HealthController } from './health.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 200 },
      { name: 'sensitive', ttl: 60000, limit: 10 },
      { name: 'health', ttl: 60000, limit: 600 },
    ]),
    PrismaModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    ProfessionalsModule,
    CategoriesModule,
    ServicesModule,
    ServiceRequestsModule,
    QuotesModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    MessagingModule,
    NotificationsModule,
    FavoritesModule,
    GeographyModule,
    UploadsModule,
    AdminModule,
    LedgerModule,
    InterventionsModule,
    DeviceTokensModule,
    BusinessesModule,
    KycModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
