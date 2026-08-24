import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      include: { district: true, neighborhood: true },
      orderBy: { isDefault: 'desc' },
    });
  }

  async create(userId: string, data: {
    label?: string;
    fullAddress: string;
    districtId?: string;
    neighborhoodId?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }) {
    return this.prisma.address.create({
      data: { userId, ...data },
    });
  }

  async update(id: string, userId: string, data: {
    label?: string;
    fullAddress?: string;
    districtId?: string;
    neighborhoodId?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Adresse non trouvée');
    return this.prisma.address.update({ where: { id }, data });
  }

  async delete(id: string, userId: string) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Adresse non trouvée');
    return this.prisma.address.delete({ where: { id } });
  }

  async setDefault(id: string, userId: string) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Adresse non trouvée');

    await this.prisma.$transaction([
      this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
      this.prisma.address.update({ where: { id }, data: { isDefault: true } }),
    ]);

    return { success: true };
  }
}
