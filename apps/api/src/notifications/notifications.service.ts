import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { IPushNotificationProvider, PUSH_NOTIFICATION_PROVIDER } from './providers/push-notification.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(PUSH_NOTIFICATION_PROVIDER) private pushProvider: IPushNotificationProvider,
  ) {}

  async create(userId: string, type: NotificationType, title: string, body: string, data?: Record<string, string>) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body, data },
    });

    await this.sendPush(userId, title, body, data);

    return notification;
  }

  private async sendPush(userId: string, title: string, body: string, data?: Record<string, string>) {
    const deviceTokens = await this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
    });

    if (deviceTokens.length === 0) return;

    const results = await this.pushProvider.send(
      deviceTokens.map((dt) => ({ token: dt.token, title, body, data })),
    );

    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      await this.prisma.deviceToken.updateMany({
        where: { token: { in: failed.map((f) => f.token) }, userId },
        data: { isActive: false },
      });
      this.logger.warn(`Deactivated ${failed.length} invalid tokens for user ${userId}`);
    }
  }

  async findByUser(userId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    const unreadCount = await this.prisma.notification.count({ where: { userId, isRead: false } });
    return { data, total, unreadCount, page, limit };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
