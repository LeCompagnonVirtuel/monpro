import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DevicePlatform } from '@prisma/client';

@Injectable()
export class DeviceTokensService {
  constructor(private prisma: PrismaService) {}

  async register(userId: string, data: { token: string; platform: DevicePlatform; deviceId?: string }) {
    return this.prisma.deviceToken.upsert({
      where: { userId_token: { userId, token: data.token } },
      update: { isActive: true, lastUsedAt: new Date(), platform: data.platform, deviceId: data.deviceId },
      create: { userId, token: data.token, platform: data.platform, deviceId: data.deviceId },
    });
  }

  async unregister(userId: string, token: string) {
    return this.prisma.deviceToken.updateMany({
      where: { userId, token },
      data: { isActive: false },
    });
  }

  async getActiveTokens(userId: string) {
    return this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
    });
  }

  async deactivateAll(userId: string) {
    return this.prisma.deviceToken.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }
}
