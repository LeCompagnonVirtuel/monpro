import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus, ServiceRequestStatus, BookingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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

  async getPendingVerifications(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
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
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async verifyProfessional(id: string, adminId: string, status: VerificationStatus, reason?: string) {
    const updated = await this.prisma.professional.update({
      where: { id },
      data: {
        verificationStatus: status,
        verifiedAt: status === VerificationStatus.VERIFIED ? new Date() : null,
        verifiedBy: adminId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: `VERIFY_PROFESSIONAL_${status}`,
        entity: 'professional',
        entityId: id,
        metadata: { reason },
      },
    });

    return updated;
  }

  async getRecentActivity(limit = 50) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
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
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;
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

  async getAllPayments(filters?: { status?: PaymentStatus; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;
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
