import { Controller, Post, Patch, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InterventionsService } from './interventions.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StartInterventionDto } from './dto/start-intervention.dto';
import { CompleteInterventionDto } from './dto/complete-intervention.dto';

@ApiTags('Interventions')
@Controller('interventions')
@ApiBearerAuth()
export class InterventionsController {
  constructor(private interventionsService: InterventionsService) {}

  @Post(':bookingId')
  @ApiOperation({ summary: 'Créer une intervention' })
  create(@Param('bookingId') bookingId: string, @CurrentUser('id') userId: string) {
    return this.interventionsService.create(bookingId, userId);
  }

  @Patch(':bookingId/arrived')
  @ApiOperation({ summary: 'Marquer arrivée' })
  markArrived(@Param('bookingId') bookingId: string, @CurrentUser('id') userId: string) {
    return this.interventionsService.markArrived(bookingId, userId);
  }

  @Patch(':bookingId/start')
  @ApiOperation({ summary: 'Démarrer l\'intervention' })
  start(
    @Param('bookingId') bookingId: string,
    @CurrentUser('id') userId: string,
    @Body() body: StartInterventionDto,
  ) {
    return this.interventionsService.start(bookingId, userId, body.beforePhotos);
  }

  @Patch(':bookingId/complete')
  @ApiOperation({ summary: 'Terminer l\'intervention' })
  complete(
    @Param('bookingId') bookingId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CompleteInterventionDto,
  ) {
    return this.interventionsService.complete(bookingId, userId, body);
  }

  @Patch(':bookingId/confirm')
  @ApiOperation({ summary: 'Client confirme la fin' })
  clientConfirm(@Param('bookingId') bookingId: string, @CurrentUser('id') userId: string) {
    return this.interventionsService.clientConfirm(bookingId, userId);
  }

  @Get(':bookingId')
  @ApiOperation({ summary: 'Détail intervention' })
  findByBooking(@Param('bookingId') bookingId: string, @CurrentUser('id') userId: string) {
    return this.interventionsService.findByBooking(bookingId, userId);
  }
}
