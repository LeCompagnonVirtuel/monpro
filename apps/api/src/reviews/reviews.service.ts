import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(clientId: string, data: {
    bookingId: string;
    overallRating: number;
    qualityRating?: number;
    punctualityRating?: number;
    communicationRating?: number;
    valuePriceRating?: number;
    comment?: string;
  }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { serviceRequest: true },
    });

    if (!booking) throw new NotFoundException('Réservation non trouvée');
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Vous ne pouvez noter qu\'une intervention terminée');
    }
    if (booking.serviceRequest.clientId !== clientId) {
      throw new ForbiddenException();
    }

    const existing = await this.prisma.review.findUnique({ where: { bookingId: data.bookingId } });
    if (existing) throw new BadRequestException('Vous avez déjà noté cette intervention');

    const review = await this.prisma.review.create({
      data: {
        bookingId: data.bookingId,
        clientId,
        professionalId: booking.professionalId,
        overallRating: data.overallRating,
        qualityRating: data.qualityRating,
        punctualityRating: data.punctualityRating,
        communicationRating: data.communicationRating,
        valuePriceRating: data.valuePriceRating,
        comment: data.comment,
      },
    });

    await this.updateProfessionalRating(booking.professionalId);

    const professional = await this.prisma.professional.findUnique({ where: { id: booking.professionalId } });
    if (professional) {
      await this.notifications.create(
        professional.userId,
        NotificationType.NEW_REVIEW,
        'Nouvel avis',
        `Un client vous a attribué ${data.overallRating}/5`,
        { bookingId: data.bookingId, reviewId: review.id },
      );
    }

    return review;
  }

  async respond(reviewId: string, userId: string, response: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Avis non trouvé');

    const professional = await this.prisma.professional.findUnique({ where: { userId } });
    if (!professional || review.professionalId !== professional.id) {
      throw new ForbiddenException('Vous ne pouvez répondre qu\'à vos propres avis');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { response, respondedAt: new Date() },
    });
  }

  async findByProfessional(professionalId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { professionalId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { fullName: true, avatarUrl: true } } },
      }),
      this.prisma.review.count({ where: { professionalId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private async updateProfessionalRating(professionalId: string) {
    const result = await this.prisma.review.aggregate({
      where: { professionalId },
      _avg: { overallRating: true },
      _count: true,
    });

    await this.prisma.professional.update({
      where: { id: professionalId },
      data: {
        averageRating: result._avg.overallRating || 0,
        totalReviews: result._count,
      },
    });
  }
}
