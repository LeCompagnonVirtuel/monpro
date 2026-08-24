import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { city: true, country: true },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return user;
  }

  async updateProfile(id: string, data: { fullName?: string; avatarUrl?: string; cityId?: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async findAll(filters?: { role?: string; search?: string; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (filters?.role) where.role = filters.role;
    if (filters?.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async suspend(id: string) {
    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }

  async reactivate(id: string) {
    return this.prisma.user.update({ where: { id }, data: { isActive: true } });
  }
}
