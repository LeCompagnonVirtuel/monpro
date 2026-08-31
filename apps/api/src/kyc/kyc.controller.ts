import { Controller, Post, Get, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('KYC')
@Controller('professionals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class KycController {
  constructor(
    private kycService: KycService,
    private prisma: PrismaService,
  ) {}

  @Post('me/kyc')
  @Roles(UserRole.PROFESSIONAL)
  @ApiOperation({ summary: 'Soumettre des documents KYC' })
  async submitKyc(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitKycDto,
  ) {
    const professional = await this.prisma.professional.findUnique({
      where: { userId },
    });
    if (!professional) {
      throw new ForbiddenException('Profil professionnel non trouvé');
    }
    return this.kycService.submit(professional.id, dto);
  }

  @Get('me/kyc')
  @Roles(UserRole.PROFESSIONAL)
  @ApiOperation({ summary: 'Obtenir le statut KYC' })
  async getMyKyc(@CurrentUser('id') userId: string) {
    const professional = await this.prisma.professional.findUnique({
      where: { userId },
    });
    if (!professional) {
      throw new ForbiddenException('Profil professionnel non trouvé');
    }
    return this.kycService.getMyKyc(professional.id);
  }
}
