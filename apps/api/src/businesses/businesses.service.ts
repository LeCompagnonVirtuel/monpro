import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, data: { name: string; registrationNo?: string; description?: string; phone?: string; email?: string; address?: string }) {
    return this.prisma.business.create({
      data: { ownerId, ...data },
      include: { members: true },
    });
  }

  async findByOwner(ownerId: string) {
    return this.prisma.business.findMany({
      where: { ownerId },
      include: { members: { include: { professional: { include: { user: { select: { fullName: true, avatarUrl: true } } } } } } },
    });
  }

  async findOne(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: { members: { include: { professional: { include: { user: { select: { fullName: true, avatarUrl: true } } } } } } },
    });
    if (!business) throw new NotFoundException('Entreprise non trouvée');
    return business;
  }

  async update(id: string, ownerId: string, data: { name?: string; description?: string; phone?: string; email?: string; address?: string; logoUrl?: string }) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) throw new NotFoundException('Entreprise non trouvée');
    if (business.ownerId !== ownerId) throw new ForbiddenException('Seul le propriétaire peut modifier l\'entreprise');

    return this.prisma.business.update({ where: { id }, data });
  }

  async addMember(businessId: string, ownerId: string, professionalId: string, role = 'member') {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Entreprise non trouvée');
    if (business.ownerId !== ownerId) throw new ForbiddenException('Seul le propriétaire peut ajouter des membres');

    const professional = await this.prisma.professional.findUnique({ where: { id: professionalId } });
    if (!professional) throw new NotFoundException('Professionnel non trouvé');

    return this.prisma.businessMember.create({
      data: { businessId, professionalId, role },
    });
  }

  async removeMember(businessId: string, ownerId: string, professionalId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Entreprise non trouvée');
    if (business.ownerId !== ownerId) throw new ForbiddenException('Seul le propriétaire peut retirer des membres');

    return this.prisma.businessMember.delete({
      where: { businessId_professionalId: { businessId, professionalId } },
    });
  }
}
