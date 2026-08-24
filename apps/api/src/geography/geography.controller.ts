import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GeographyService } from './geography.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Geography')
@Controller('geography')
export class GeographyController {
  constructor(private geographyService: GeographyService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Liste des pays' })
  getCountries() {
    return this.geographyService.getCountries();
  }

  @Get('countries/:countryId/regions')
  @ApiOperation({ summary: 'Régions d\'un pays' })
  getRegions(@Param('countryId') countryId: string) {
    return this.geographyService.getRegions(countryId);
  }

  @Get('regions/:regionId/cities')
  @ApiOperation({ summary: 'Villes d\'une région' })
  getCities(@Param('regionId') regionId: string) {
    return this.geographyService.getCities(regionId);
  }

  @Get('cities/:cityId/districts')
  @ApiOperation({ summary: 'Communes d\'une ville' })
  getDistricts(@Param('cityId') cityId: string) {
    return this.geographyService.getDistricts(cityId);
  }

  @Get('districts/:districtId/neighborhoods')
  @ApiOperation({ summary: 'Quartiers d\'une commune' })
  getNeighborhoods(@Param('districtId') districtId: string) {
    return this.geographyService.getNeighborhoods(districtId);
  }

  @Post('countries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un pays (admin)' })
  createCountry(@Body() body: { name: string; code: string; dialCode: string; currency: string }) {
    return this.geographyService.createCountry(body);
  }

  @Post('regions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une région (admin)' })
  createRegion(@Body() body: { name: string; countryId: string }) {
    return this.geographyService.createRegion(body);
  }

  @Post('cities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une ville (admin)' })
  createCity(@Body() body: { name: string; regionId: string }) {
    return this.geographyService.createCity(body);
  }

  @Post('districts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une commune (admin)' })
  createDistrict(@Body() body: { name: string; cityId: string }) {
    return this.geographyService.createDistrict(body);
  }

  @Post('neighborhoods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un quartier (admin)' })
  createNeighborhood(@Body() body: { name: string; districtId: string }) {
    return this.geographyService.createNeighborhood(body);
  }
}
