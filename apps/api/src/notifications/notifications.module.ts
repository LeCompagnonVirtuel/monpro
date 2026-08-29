import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PUSH_NOTIFICATION_PROVIDER } from './providers/push-notification.interface';
import { DevPushProvider } from './providers/dev-push.provider';

const pushProviderFactory = {
  provide: PUSH_NOTIFICATION_PROVIDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const provider = config.get<string>('PUSH_NOTIFICATION_PROVIDER', 'dev');
    switch (provider) {
      case 'expo':
        return new DevPushProvider();
      case 'dev':
        return new DevPushProvider();
      default:
        throw new Error(
          `Unknown PUSH_NOTIFICATION_PROVIDER: "${provider}". Valid values: "dev", "expo"`,
        );
    }
  },
};

@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    pushProviderFactory,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
