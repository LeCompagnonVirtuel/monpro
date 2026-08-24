import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private otpService: OtpService,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    const code = await this.otpService.generate(dto.phone);
    await this.prisma.otpCode.create({
      data: {
        phone: dto.phone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
    return { message: 'OTP envoyé', expiresIn: 300 };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone: dto.phone,
        code: dto.code,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Code OTP invalide ou expiré');
    }

    if (otpRecord.attempts >= 3) {
      throw new BadRequestException('Trop de tentatives. Demandez un nouveau code.');
    }

    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    const existingUser = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existingUser) {
      const tokens = await this.generateTokens(existingUser.id, existingUser.role);
      return { isNewUser: false, ...tokens };
    }

    return { isNewUser: true, phone: dto.phone };
  }

  async register(dto: RegisterDto) {
    const verified = await this.prisma.otpCode.findFirst({
      where: { phone: dto.phone, verified: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!verified) {
      throw new BadRequestException('Numéro non vérifié. Veuillez d\'abord vérifier votre OTP.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new BadRequestException('Ce numéro est déjà inscrit.');
    }

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        fullName: dto.fullName,
        role: dto.role || UserRole.CLIENT,
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
      throw new UnauthorizedException('Token invalide ou expiré');
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
