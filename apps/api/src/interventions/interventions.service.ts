import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InterventionsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(bookingId: string, professionalUserId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { professional: true },
    });
    if (!booking) throw new NotFoundException('Réservation non trouvée');
    if (booking.professional.userId !== professionalUserId) {
      throw new ForbiddenException('Seul le professionnel assigné peut créer une intervention');
    }

    const existing = await this.prisma.intervention.findUnique({ where: { bookingId } });
    if (existing) throw new BadRequestException('Une intervention existe déjà pour cette réservation');

    return this.prisma.intervention.create({
      data: { bookingId },
    });
  }

  async markArrived(bookingId: string, professionalUserId: string) {
    const intervention = await this.getAndValidateProfessional(bookingId, professionalUserId);
    const result = await this.prisma.intervention.update({
      where: { id: intervention.id },
      data: { arrivedAt: new Date() },
    });

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { serviceRequest: true },
    });
    if (booking) {
      await this.notifications.create(
        booking.serviceRequest.clientId,
        NotificationType.PROFESSIONAL_ARRIVING,
        'Le professionnel est arrivé',
        'Le professionnel est sur place pour votre intervention',
        { bookingId },
      );
    }

    return result;
  }

  async start(bookingId: string, professionalUserId: string, beforePhotos: string[]) {
    const intervention = await this.getAndValidateProfessional(bookingId, professionalUserId);
    return this.prisma.intervention.update({
      where: { id: intervention.id },
      data: { startedAt: new Date(), beforePhotos },
    });
  }

  async complete(bookingId: string, professionalUserId: string, data: { afterPhotos: string[]; completionNotes?: string }) {
    const intervention = await this.getAndValidateProfessional(bookingId, professionalUserId);
    if (!intervention.startedAt) throw new BadRequestException('L\'intervention n\'a pas encore commencé');

    const result = await this.prisma.intervention.update({
      where: { id: intervention.id },
      data: {
        completedAt: new Date(),
        afterPhotos: data.afterPhotos,
        completionNotes: data.completionNotes,
      },
    });

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { serviceRequest: true },
    });
    if (booking) {
      await this.notifications.create(
        booking.serviceRequest.clientId,
        NotificationType.INTERVENTION_COMPLETED,
        'Intervention terminée',
        'Le professionnel a terminé l\'intervention. Veuillez confirmer.',
        { bookingId },
      );
    }

    return result;
  }

  async clientConfirm(bookingId: string, clientUserId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { serviceRequest: true },
    });
    if (!booking) throw new NotFoundException('Réservation non trouvée');
    if (booking.serviceRequest.clientId !== clientUserId) {
      throw new ForbiddenException('Seul le client peut confirmer la fin de l\'intervention');
    }

    const intervention = await this.prisma.intervention.findUnique({ where: { bookingId } });
    if (!intervention) throw new NotFoundException('Intervention non trouvée');
    if (!intervention.completedAt) throw new BadRequestException('L\'intervention n\'est pas terminée');

    return this.prisma.intervention.update({
      where: { id: intervention.id },
      data: { clientConfirmed: true, clientConfirmedAt: new Date() },
    });
  }

  async findByBooking(bookingId: string, userId?: string) {
    if (userId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { serviceRequest: true, professional: true },
      });
      if (!booking) throw new NotFoundException('Réservation non trouvée');
      const isClient = booking.serviceRequest.clientId === userId;
      const isProfessional = booking.professional.userId === userId;
      if (!isClient && !isProfessional) {
        throw new ForbiddenException('Accès interdit');
      }
    }
    return this.prisma.intervention.findUnique({ where: { bookingId } });
  }

  private async getAndValidateProfessional(bookingId: string, professionalUserId: string) {
    const intervention = await this.prisma.intervention.findUnique({
      where: { bookingId },
      include: { booking: { include: { professional: true } } },
    });
    if (!intervention) throw new NotFoundException('Intervention non trouvée');
    if (intervention.booking.professional.userId !== professionalUserId) {
      throw new ForbiddenException('Accès interdit');
    }
    return intervention;
  }
}
