import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KycStatus, VerificationStatus } from '@prisma/client';
import { SubmitKycDto } from './dto/submit-kyc.dto';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(private prisma: PrismaService) {}

  async submit(professionalId: string, dto: SubmitKycDto) {
    const professional = await this.prisma.professional.findUnique({
      where: { id: professionalId },
    });

    if (!professional) {
      throw new NotFoundException('Profil professionnel non trouvé');
    }

    // Vérifier si un KYC est déjà en cours ou approuvé
    const existingKyc = await this.prisma.kycDocument.findFirst({
      where: {
        professionalId,
        status: { in: [KycStatus.PENDING, KycStatus.APPROVED] },
      },
      orderBy: { submittedAt: 'desc' },
    });

    if (existingKyc?.status === KycStatus.APPROVED) {
      throw new Error('Un document KYC approuvé existe déjà');
    }

    // Si un KYC est en attente, le mettre à jour au lieu de créer un nouveau
    if (existingKyc?.status === KycStatus.PENDING) {
      this.logger.log(`Mise à jour du KYC en attente ${existingKyc.id} pour le professionnel ${professionalId}`);
      return this.prisma.kycDocument.update({
        where: { id: existingKyc.id },
        data: {
          documentType: dto.documentType,
          documentNumber: dto.documentNumber,
          frontUrl: dto.frontUrl,
          backUrl: dto.backUrl,
          selfieUrl: dto.selfieUrl,
          submittedAt: new Date(),
        },
      });
    }

    // Mettre à jour le statut de vérification du professionnel si nécessaire
    if (
      professional.verificationStatus === VerificationStatus.REJECTED ||
      professional.verificationStatus === null
    ) {
      await this.prisma.professional.update({
        where: { id: professionalId },
        data: { verificationStatus: VerificationStatus.PENDING },
      });
    }

    this.logger.log(`Soumission KYC pour le professionnel ${professionalId}`);
    return this.prisma.kycDocument.create({
      data: {
        professionalId,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        frontUrl: dto.frontUrl,
        backUrl: dto.backUrl,
        selfieUrl: dto.selfieUrl,
        status: KycStatus.PENDING,
      },
    });
  }

  async getMyKyc(professionalId: string) {
    const kyc = await this.prisma.kycDocument.findFirst({
      where: { professionalId },
      orderBy: { submittedAt: 'desc' },
    });

    if (!kyc) {
      throw new NotFoundException('Aucun document KYC trouvé');
    }

    return kyc;
  }

  async getAllPending() {
    return this.prisma.kycDocument.findMany({
      where: { status: KycStatus.PENDING },
      orderBy: { submittedAt: 'asc' },
      include: {
        professional: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true } },
          },
        },
      },
    });
  }
}
