import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        subcategories: {
          where: includeInactive ? {} : { isActive: true },
          include: {
            services: {
              where: includeInactive ? {} : { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: {
          include: { services: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async create(data: { name: string; slug: string; description?: string; iconUrl?: string; sortOrder?: number }) {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: Partial<{ name: string; slug: string; description: string; iconUrl: string; sortOrder: number; isActive: boolean }>) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.category.update({ where: { id }, data: { isActive: false } });
  }
}
