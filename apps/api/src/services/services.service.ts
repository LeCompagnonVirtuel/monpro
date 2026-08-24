import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { categoryId?: string; subcategoryId?: string; search?: string }) {
    const where: any = { isActive: true };

    if (filters?.subcategoryId) {
      where.subcategoryId = filters.subcategoryId;
    }

    if (filters?.categoryId) {
      where.subcategory = { categoryId: filters.categoryId };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.service.findMany({
      where,
      include: { subcategory: { include: { category: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
      include: {
        subcategory: { include: { category: true } },
        professionals: {
          include: { professional: { include: { user: { select: { fullName: true, avatarUrl: true } } } } },
        },
      },
    });
  }

  async search(query: string) {
    return this.prisma.service.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { subcategory: { name: { contains: query, mode: 'insensitive' } } },
          { subcategory: { category: { name: { contains: query, mode: 'insensitive' } } } },
        ],
      },
      include: { subcategory: { include: { category: true } } },
      take: 20,
    });
  }
}
