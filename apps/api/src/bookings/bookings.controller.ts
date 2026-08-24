import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BookingStatus } from '@prisma/client';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une réservation à partir d\'un devis accepté' })
  create(@Body() body: { quoteId: string; scheduledDate: Date; scheduledTime?: string; addressId?: string }) {
    return this.bookingsService.createFromQuote(body.quoteId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une réservation' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Get('professional/:professionalId')
  @ApiOperation({ summary: 'Réservations d\'un professionnel' })
  findByProfessional(
    @Param('professionalId') professionalId: string,
    @Query('status') status?: BookingStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bookingsService.findByProfessional(professionalId, status, page, limit);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Modifier le statut d\'une réservation' })
  updateStatus(@Param('id') id: string, @Body('status') status: BookingStatus) {
    return this.bookingsService.updateStatus(id, status);
  }
}
