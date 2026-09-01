import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BookingStatus } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une réservation à partir d\'un devis accepté' })
  create(
    @CurrentUser('id') userId: string,
    @Body() body: CreateBookingDto,
  ) {
    return this.bookingsService.createFromQuote(body.quoteId, body, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une réservation' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.bookingsService.findOne(id, userId);
  }

  @Get('professional/:professionalId')
  @ApiOperation({ summary: 'Réservations d\'un professionnel' })
  async findByProfessional(
    @Param('professionalId') professionalId: string,
    @CurrentUser('id') userId: string,
    @Query('status') status?: BookingStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bookingsService.findByProfessional(professionalId, status, page, limit, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Modifier le statut d\'une réservation' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, body.status, userId, body.cancellationReason);
  }
}
