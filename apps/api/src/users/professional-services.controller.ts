import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProfessionalServicesService } from './professional-services.service';

@ApiTags('Professional Services')
@Controller('professionals/:professionalId/services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfessionalServicesController {
  constructor(private professionalServicesService: ProfessionalServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Services d\'un professionnel' })
  findByProfessional(
    @Param('professionalId') professionalId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.professionalServicesService.findByProfessional(professionalId, userId);
  }

  @Post(':serviceId')
  @ApiOperation({ summary: 'Ajouter un service' })
  addService(
    @Param('professionalId') professionalId: string,
    @Param('serviceId') serviceId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { priceMin?: number; priceMax?: number; description?: string },
  ) {
    return this.professionalServicesService.addService(professionalId, serviceId, userId, body);
  }

  @Patch(':serviceId')
  @ApiOperation({ summary: 'Modifier un service' })
  updateService(
    @Param('professionalId') professionalId: string,
    @Param('serviceId') serviceId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { priceMin?: number; priceMax?: number; description?: string },
  ) {
    return this.professionalServicesService.updateService(professionalId, serviceId, userId, body);
  }

  @Delete(':serviceId')
  @ApiOperation({ summary: 'Supprimer un service' })
  removeService(
    @Param('professionalId') professionalId: string,
    @Param('serviceId') serviceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.professionalServicesService.removeService(professionalId, serviceId, userId);
  }
}
