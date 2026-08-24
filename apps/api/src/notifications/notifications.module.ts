import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PUSH_NOTIFICATION_PROVIDER } from './providers/push-notification.interface';
import { DevPushProvider } from './providers/dev-push.provider';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    { provide: PUSH_NOTIFICATION_PROVIDER, useClass: DevPushProvider },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
