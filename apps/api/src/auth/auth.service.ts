import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { normalizePhone } from '../common/utils/phone';
import { UserRole } from '@prisma/client';
import { v4 as uuid } from 'uuid';

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 3;
const OTP_REGISTRATION_WINDOW_MS = 10 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private otpService: OtpService,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    const phone = normalizePhone(dto.phone);

    const recentCount = await this.prisma.otpCode.count({
      where: {
        phone,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });
    if (recentCount >= 1) {
      throw new BadRequestException('Veuillez attendre 60 secondes avant de demander un nouveau code.');
    }

    let hash: string;
    try {
      ({ hash } = await this.otpService.generate(phone));
    } catch (error) {
      this.logger.error(`SMS provider error: category=provider_failure`);
      throw new BadRequestException("Impossible d'envoyer le code de vérification. Veuillez réessayer.");
    }

    await this.prisma.otpCode.create({
      data: {
        phone,
        code: hash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    return { message: 'OTP envoyé', expiresIn: 300 };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const phone = normalizePhone(dto.phone);

    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Code OTP invalide ou expiré');
    }

    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Trop de tentatives. Demandez un nouveau code.');
    }

    const isValid = await this.otpService.verify(dto.code, otpRecord.code);

    if (!isValid) {
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Code OTP invalide');
    }

    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      if (!existingUser.isActive) {
        throw new UnauthorizedException('Votre compte est suspendu.');
      }
      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: { lastLoginAt: new Date() },
      });
      const tokens = await this.generateTokens(existingUser.id, existingUser.role);
      return { isNewUser: false, user: { id: existingUser.id, fullName: existingUser.fullName, role: existingUser.role }, ...tokens };
    }

    return { isNewUser: true, phone: dto.phone };
  }

  async register(dto: RegisterDto) {
    const phone = normalizePhone(dto.phone);

    const verified = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        verified: true,
        createdAt: { gt: new Date(Date.now() - OTP_REGISTRATION_WINDOW_MS) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verified) {
      throw new BadRequestException('Numéro non vérifié ou délai expiré. Veuillez vérifier votre OTP.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existing) {
      throw new BadRequestException('Ce numéro est déjà inscrit.');
    }

    const allowedRoles: UserRole[] = [UserRole.CLIENT, UserRole.PROFESSIONAL];
    const role = dto.role && allowedRoles.includes(dto.role) ? dto.role : UserRole.CLIENT;

    const user = await this.prisma.user.create({
      data: {
        phone,
        fullName: dto.fullName,
        role,
        cityId: dto.cityId,
        countryId: dto.countryId,
      },
    });

    const tokens = await this.generateTokens(user.id, user.role);
    return { user: { id: user.id, phone: user.phone, fullName: user.fullName, role: user.role }, ...tokens };
  }

  async refreshToken(token: string) {
    const record = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      if (record) {
        await this.prisma.refreshToken.delete({ where: { id: record.id } });
      }
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    if (!record.user.isActive) {
      throw new UnauthorizedException('Compte suspendu');
    }

    await this.prisma.refreshToken.delete({ where: { id: record.id } });
    return this.generateTokens(record.user.id, record.user.role);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Déconnecté' };
  }

  private async generateTokens(userId: string, role: UserRole) {
    const payload = { sub: userId, role };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = uuid();

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}
