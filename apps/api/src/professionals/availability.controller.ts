import { Controller, Get, Put, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { SetAvailabilityDto } from './dto/set-availability.dto';

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
    @CurrentUser('id') userId: string,
    @Body() body: SetAvailabilityDto,
  ) {
    const professional = await this.prisma.professional.findUnique({ where: { id: professionalId } });
    if (!professional || professional.userId !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres disponibilités');
    }

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
