import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceRequestsService } from './service-requests.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { ServiceRequestStatus } from '@prisma/client';

@ApiTags('Service Requests')
@Controller('service-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServiceRequestsController {
  constructor(private serviceRequestsService: ServiceRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une demande de service' })
  create(@CurrentUser('id') userId: string, @Body() body: CreateServiceRequestDto) {
    return this.serviceRequestsService.create(userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Mes demandes (client)' })
  findMine(
    @CurrentUser('id') userId: string,
    @Query('status') status?: ServiceRequestStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.serviceRequestsService.findByClient(userId, status, page, limit);
  }

  @Get('available')
  @ApiOperation({ summary: 'Demandes disponibles (professionnel)' })
  async findAvailable(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.serviceRequestsService.findForProfessionalByUserId(userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une demande' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.serviceRequestsService.findOne(id, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Modifier le statut d\'une demande' })
  updateStatus(@Param('id') id: string, @Body('status') status: ServiceRequestStatus, @CurrentUser('id') userId: string) {
    return this.serviceRequestsService.updateStatus(id, status, userId);
  }
}
