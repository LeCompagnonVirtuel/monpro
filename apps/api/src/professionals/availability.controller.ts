import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Professionals')
@Controller('professionals/:professionalId/availability')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AvailabilityController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Disponibilités d\'un professionnel' })
  findAll(@Param('professionalId') professionalId: string) {
    return this.prisma.professionalAvailability.findMany({
      where: { professionalId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  @Put()
  @ApiOperation({ summary: 'Définir les disponibilités' })
  async setAvailability(
    @Param('professionalId') professionalId: string,
    @Body() body: { slots: { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }[] },
  ) {
    await this.prisma.professionalAvailability.deleteMany({ where: { professionalId } });

    if (body.slots?.length) {
      await this.prisma.professionalAvailability.createMany({
        data: body.slots.map((slot) => ({
          professionalId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isActive: slot.isActive,
        })),
      });
    }

    return this.prisma.professionalAvailability.findMany({
      where: { professionalId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }
}
