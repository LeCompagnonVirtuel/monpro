import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfessionalsService } from './professionals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, VerificationStatus } from '@prisma/client';

@ApiTags('Professionals')
@Controller('professionals')
export class ProfessionalsController {
  constructor(private professionalsService: ProfessionalsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les professionnels' })
  findAll(
    @Query('serviceId') serviceId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('verified') verified?: boolean,
    @Query('available') available?: boolean,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.professionalsService.findAll({ serviceId, categoryId, verified, available, search, page, limit, sortBy });
  }

  @Get('match')
  @ApiOperation({ summary: 'Trouver des professionnels pour un service' })
  match(
    @Query('serviceId') serviceId: string,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
  ) {
    return this.professionalsService.matchForRequest(serviceId, latitude, longitude);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Profil d\'un professionnel' })
  findOne(@Param('id') id: string) {
    return this.professionalsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un profil professionnel' })
  create(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.professionalsService.createProfile(userId, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier le profil professionnel' })
  update(@Param('id') id: string, @Body() body: any) {
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
