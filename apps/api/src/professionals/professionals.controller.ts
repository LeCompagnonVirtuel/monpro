import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfessionalsService } from './professionals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { UserRole, VerificationStatus } from '@prisma/client';

@ApiTags('Professionals')
@Controller('professionals')
export class ProfessionalsController {
  constructor(private professionalsService: ProfessionalsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lister les professionnels' })
  findAll(
    @Query('serviceId') serviceId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('verified') verified?: boolean,
    @Query('available') available?: boolean,
    @Query('search') search?: string,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('radiusKm') radiusKm?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.professionalsService.findAll({ serviceId, categoryId, verified, available, search, latitude, longitude, radiusKm, page, limit, sortBy });
  }

  @Get('match')
  @Public()
  @ApiOperation({ summary: 'Trouver des professionnels pour un service' })
  match(
    @Query('serviceId') serviceId: string,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
  ) {
    return this.professionalsService.matchForRequest(serviceId, latitude, longitude);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Profil d\'un professionnel' })
  findOne(@Param('id') id: string) {
    return this.professionalsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un profil professionnel' })
  create(@CurrentUser('id') userId: string, @Body() body: CreateProfessionalDto) {
    return this.professionalsService.createProfile(userId, body);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier le profil professionnel' })
  async update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() body: UpdateProfessionalDto) {
    const profile = await this.professionalsService.findOne(id);
    if (profile.userId !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que votre propre profil');
    }
    return this.professionalsService.updateProfile(id, body);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vérifier un professionnel (admin)' })
  verify(@Param('id') id: string, @CurrentUser('id') adminId: string, @Body('status') status: VerificationStatus) {
    return this.professionalsService.verify(id, adminId, status);
  }
}
