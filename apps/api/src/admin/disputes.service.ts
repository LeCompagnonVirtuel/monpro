import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DisputeStatus } from '@prisma/client';

@Injectable()
export class DisputesService {
  constructor(private prisma: PrismaService) {}

  async create(reporterId: string, data: { bookingId: string; reason: string; description?: string }) {
    return this.prisma.dispute.create({
      data: {
        bookingId: data.bookingId,
        reporterId,
        reason: data.reason,
        description: data.description,
      },
    });
  }

  async findAll(filters?: { status?: DisputeStatus; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters?.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async resolve(id: string, adminId: string, resolution: string) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) throw new NotFoundException('Litige non trouvé');

    return this.prisma.dispute.update({
      where: { id },
      data: {
        status: DisputeStatus.RESOLVED,
        resolution,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
    });
  }

  async createReport(reporterId: string, data: { reportedId: string; reason: string; description?: string }) {
    return this.prisma.report.create({
      data: {
        reporterId,
        reportedId: data.reportedId,
        reason: data.reason,
        description: data.description,
      },
    });
  }

  async getReports(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { isResolved: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count({ where: { isResolved: false } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async resolveReport(id: string, adminId: string) {
    return this.prisma.report.update({
      where: { id },
      data: { isResolved: true, resolvedBy: adminId },
    });
  }
}
