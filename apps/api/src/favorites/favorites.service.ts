import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async addProfessional(userId: string, professionalId: string) {
    return this.prisma.favorite.upsert({
      where: { userId_professionalId: { userId, professionalId } },
      create: { userId, professionalId },
      update: {},
    });
  }

  async removeProfessional(userId: string, professionalId: string) {
    return this.prisma.favorite.deleteMany({ where: { userId, professionalId } });
  }

  async findByUser(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId, professionalId: { not: null } },
      include: {
        user: false,
      },
    });
  }

  async getFavoriteProfessionals(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId, professionalId: { not: null } },
      select: { professionalId: true },
    });

    const ids = favorites.map((f) => f.professionalId).filter(Boolean) as string[];
    if (!ids.length) return [];

    return this.prisma.professional.findMany({
      where: { id: { in: ids } },
      include: {
        user: { select: { fullName: true, avatarUrl: true } },
        services: { include: { service: true } },
      },
    });
  }

  async isFavorite(userId: string, professionalId: string): Promise<boolean> {
    const fav = await this.prisma.favorite.findUnique({
      where: { userId_professionalId: { userId, professionalId } },
    });
    return !!fav;
  }
}
