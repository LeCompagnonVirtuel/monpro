import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Addresses')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Mes adresses' })
  findMine(@CurrentUser('id') userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      include: { district: true, neighborhood: true },
      orderBy: { isDefault: 'desc' },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Ajouter une adresse' })
  create(@CurrentUser('id') userId: string, @Body() body: {
    label?: string;
    fullAddress: string;
    districtId?: string;
    neighborhoodId?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }) {
    return this.prisma.address.create({
      data: { userId, ...body },
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une adresse' })
  update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() body: any) {
    return this.prisma.address.updateMany({
      where: { id, userId },
      data: body,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une adresse' })
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.prisma.address.deleteMany({ where: { id, userId } });
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Définir comme adresse par défaut' })
  async setDefault(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return this.prisma.address.updateMany({ where: { id, userId }, data: { isDefault: true } });
  }
}
