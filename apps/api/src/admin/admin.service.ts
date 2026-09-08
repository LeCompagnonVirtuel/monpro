import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VerificationStatus, ServiceRequestStatus, BookingStatus, PaymentStatus, KycStatus, NotificationType } from '@prisma/client';
import { paginate } from '../common/utils/pagination';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalProfessionals,
      pendingVerifications,
      totalRequests,
      activeBookings,
      completedBookings,
      totalRevenue,
      totalCommission,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.professional.count(),
      this.prisma.professional.count({ where: { verificationStatus: VerificationStatus.PENDING } }),
      this.prisma.serviceRequest.count(),
      this.prisma.booking.count({ where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] } } }),
      this.prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      this.prisma.payment.aggregate({ where: { status: PaymentStatus.COMPLETED }, _sum: { amount: true } }),
      this.prisma.payment.aggregate({ where: { status: PaymentStatus.COMPLETED }, _sum: { commission: true } }),
    ]);

    const newUsersThisMonth = await this.prisma.user.count({
      where: {
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    });

    const requestsByStatus = await this.prisma.serviceRequest.groupBy({
      by: ['status'],
      _count: true,
    });

    const topCategories = await this.prisma.serviceRequest.groupBy({
      by: ['serviceId'],
      _count: true,
      orderBy: { _count: { serviceId: 'desc' } },
      take: 10,
    });

    return {
      users: { total: totalUsers, newThisMonth: newUsersThisMonth },
      professionals: { total: totalProfessionals, pendingVerifications },
      requests: { total: totalRequests, byStatus: requestsByStatus },
      bookings: { active: activeBookings, completed: completedBookings },
      revenue: {
        totalGMV: totalRevenue._sum.amount || 0,
        totalCommission: totalCommission._sum.commission || 0,
        currency: 'XOF',
      },
      topCategories,
    };
  }

  async getPendingVerifications(page?: number, limit?: number) {
    const { page: p, limit: l, skip } = paginate(page, limit);
    const [data, total] = await Promise.all([
      this.prisma.professional.findMany({
        where: { verificationStatus: VerificationStatus.PENDING },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { fullName: true, phone: true, avatarUrl: true, createdAt: true } },
          services: { include: { service: true } },
          kycDocuments: true,
        },
      }),
      this.prisma.professional.count({ where: { verificationStatus: VerificationStatus.PENDING } }),
    ]);
    return { data, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  async verifyProfessional(id: string, adminId: string, status: VerificationStatus, reason?: string) {
    const kycStatus = status === VerificationStatus.VERIFIED ? KycStatus.APPROVED : KycStatus.REJECTED;

    const professional = await this.prisma.professional.findUnique({
      where: { id },
      select: { userId: true },
    });

    const [updated] = await this.prisma.$transaction([
      this.prisma.professional.update({
        where: { id },
        data: {
          verificationStatus: status,
          verifiedAt: status === VerificationStatus.VERIFIED ? new Date() : null,
          verifiedBy: adminId,
        },
      }),
      this.prisma.kycDocument.updateMany({
        where: { professionalId: id, status: KycStatus.PENDING },
        data: {
          status: kycStatus,
          reviewedAt: new Date(),
          reviewedBy: adminId,
          rejectionReason: status === VerificationStatus.REJECTED ? reason : null,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          userId: adminId,
          action: `VERIFY_PROFESSIONAL_${status}`,
          entity: 'professional',
          entityId: id,
          metadata: { reason, kycStatus },
        },
      }),
    ]);

    if (professional?.userId) {
      const notifType = status === VerificationStatus.VERIFIED ? NotificationType.KYC_APPROVED : NotificationType.KYC_REJECTED;
      const title = status === VerificationStatus.VERIFIED ? 'Profil vérifié' : 'Vérification refusée';
      const body = status === VerificationStatus.VERIFIED
        ? 'Votre identité a été vérifiée avec succès. Votre profil est maintenant visible par les clients.'
        : `Votre dossier de vérification a été refusé.${reason ? ` Motif : ${reason}` : ''} Vous pouvez soumettre un nouveau dossier.`;
      await this.notificationsService.create(professional.userId, notifType, title, body);
    }

    return updated;
  }

  async getRecentActivity(limit?: number) {
    const { limit: l } = paginate(1, limit);
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: l,
    });
  }

  async getCommissionConfigs() {
    return this.prisma.commissionConfig.findMany({
      orderBy: { isDefault: 'desc' },
    });
  }

  async updateCommission(id: string, rate: number) {
    return this.prisma.commissionConfig.update({
      where: { id },
      data: { rate },
    });
  }

  async createCommission(data: { categoryId?: string; rate: number; isDefault?: boolean }) {
    return this.prisma.commissionConfig.create({ data });
  }

  async getAllBookings(filters?: { status?: BookingStatus; page?: number; limit?: number }) {
    const { page, limit, skip } = paginate(filters?.page, filters?.limit);
    const where: any = {};
    if (filters?.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          serviceRequest: { include: { service: true, client: { select: { fullName: true, phone: true } } } },
          professional: { include: { user: { select: { fullName: true, phone: true } } } },
          payment: true,
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getKycSubmissions(filters?: { status?: KycStatus; page?: number; limit?: number }) {
    const { page: p, limit: l, skip } = paginate(filters?.page, filters?.limit);
    const where: any = {};
    if (filters?.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.kycDocument.findMany({
        where,
        skip,
        take: l,
        orderBy: { submittedAt: 'desc' },
        include: {
          professional: {
            include: {
              user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
            },
          },
        },
      }),
      this.prisma.kycDocument.count({ where }),
    ]);

    return { data, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  async approveKyc(kycId: string, adminId: string) {
    const kyc = await this.prisma.kycDocument.findUnique({ where: { id: kycId } });
    if (!kyc) throw new Error('Document KYC non trouvé');
    if (kyc.status === KycStatus.APPROVED) throw new Error('Document KYC déjà approuvé');

    const professional = await this.prisma.professional.findUnique({
      where: { id: kyc.professionalId },
      select: { userId: true },
    });

    const [updated] = await this.prisma.$transaction([
      this.prisma.kycDocument.update({
        where: { id: kycId },
        data: { status: KycStatus.APPROVED, reviewedAt: new Date(), reviewedBy: adminId },
      }),
      this.prisma.professional.update({
        where: { id: kyc.professionalId },
        data: { verificationStatus: VerificationStatus.VERIFIED, verifiedAt: new Date(), verifiedBy: adminId },
      }),
      this.prisma.auditLog.create({
        data: { userId: adminId, action: 'KYC_APPROVED', entity: 'kycDocument', entityId: kycId },
      }),
    ]);

    if (professional?.userId) {
      await this.notificationsService.create(
        professional.userId,
        NotificationType.KYC_APPROVED,
        'Profil vérifié',
        'Votre identité a été vérifiée avec succès. Votre profil est maintenant visible par les clients.',
      );
    }

    return updated;
  }

  async rejectKyc(kycId: string, adminId: string, reason: string) {
    const kyc = await this.prisma.kycDocument.findUnique({ where: { id: kycId } });
    if (!kyc) throw new Error('Document KYC non trouvé');
    if (kyc.status === KycStatus.REJECTED) throw new Error('Document KYC déjà rejeté');

    const professional = await this.prisma.professional.findUnique({
      where: { id: kyc.professionalId },
      select: { userId: true },
    });

    const [updated] = await this.prisma.$transaction([
      this.prisma.kycDocument.update({
        where: { id: kycId },
        data: { status: KycStatus.REJECTED, reviewedAt: new Date(), reviewedBy: adminId, rejectionReason: reason },
      }),
      this.prisma.professional.update({
        where: { id: kyc.professionalId },
        data: { verificationStatus: VerificationStatus.REJECTED },
      }),
      this.prisma.auditLog.create({
        data: { userId: adminId, action: 'KYC_REJECTED', entity: 'kycDocument', entityId: kycId, metadata: { reason } },
      }),
    ]);

    if (professional?.userId) {
      await this.notificationsService.create(
        professional.userId,
        NotificationType.KYC_REJECTED,
        'Vérification refusée',
        `Votre dossier de vérification a été refusé. Motif : ${reason}. Vous pouvez soumettre un nouveau dossier.`,
      );
    }

    return updated;
  }

  async getAllPayments(filters?: { status?: PaymentStatus; page?: number; limit?: number }) {
    const { page, limit, skip } = paginate(filters?.page, filters?.limit);
    const where: any = {};
    if (filters?.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              serviceRequest: { include: { client: { select: { fullName: true } } } },
              professional: { include: { user: { select: { fullName: true } } } },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
