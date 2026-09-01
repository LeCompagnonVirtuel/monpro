import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfessionalServicesService {
  constructor(private prisma: PrismaService) {}

  async findByProfessional(professionalId: string, userId?: string) {
    if (userId) {
      const professional = await this.prisma.professional.findUnique({ where: { id: professionalId } });
      if (!professional || professional.userId !== userId) {
        throw new ForbiddenException('Accès interdit');
      }
    }

    return this.prisma.professionalService.findMany({
      where: { professionalId },
      include: { service: { include: { subcategory: { include: { category: true } } } } },
    });
  }

  async addService(professionalId: string, serviceId: string, userId: string, data?: { priceMin?: number; priceMax?: number; description?: string }) {
    const professional = await this.prisma.professional.findUnique({ where: { id: professionalId } });
    if (!professional) throw new NotFoundException('Professionnel non trouvé');
    if (professional.userId !== userId) {
      throw new ForbiddenException('Seul le professionnel peut modifier ses services');
    }

    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new NotFoundException('Service non trouvé');

    const existing = await this.prisma.professionalService.findUnique({
      where: { professionalId_serviceId: { professionalId, serviceId } },
    });
    if (existing) throw new ConflictException('Ce service est déjà ajouté');

    return this.prisma.professionalService.create({
      data: {
        professionalId,
        serviceId,
        priceMin: data?.priceMin,
        priceMax: data?.priceMax,
        description: data?.description,
      },
      include: { service: true },
    });
  }

  async updateService(professionalId: string, serviceId: string, userId: string, data: { priceMin?: number; priceMax?: number; description?: string }) {
    const professional = await this.prisma.professional.findUnique({ where: { id: professionalId } });
    if (!professional) throw new NotFoundException('Professionnel non trouvé');
    if (professional.userId !== userId) {
      throw new ForbiddenException('Seul le professionnel peut modifier ses services');
    }

    const existing = await this.prisma.professionalService.findUnique({
      where: { professionalId_serviceId: { professionalId, serviceId } },
    });
    if (!existing) throw new NotFoundException('Service non trouvé dans votre profil');

    return this.prisma.professionalService.update({
      where: { professionalId_serviceId: { professionalId, serviceId } },
      data,
      include: { service: true },
    });
  }

  async removeService(professionalId: string, serviceId: string, userId: string) {
    const professional = await this.prisma.professional.findUnique({ where: { id: professionalId } });
    if (!professional) throw new NotFoundException('Professionnel non trouvé');
    if (professional.userId !== userId) {
      throw new ForbiddenException('Seul le professionnel peut modifier ses services');
    }

    const existing = await this.prisma.professionalService.findUnique({
      where: { professionalId_serviceId: { professionalId, serviceId } },
    });
    if (!existing) throw new NotFoundException('Service non trouvé dans votre profil');

    return this.prisma.professionalService.delete({
      where: { professionalId_serviceId: { professionalId, serviceId } },
    });
  }
}
