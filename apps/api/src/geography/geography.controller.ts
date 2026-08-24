import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GeographyService } from './geography.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { CreateCountryDto } from './dto/create-country.dto';
import { CreateRegionDto } from './dto/create-region.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { CreateDistrictDto } from './dto/create-district.dto';
import { CreateNeighborhoodDto } from './dto/create-neighborhood.dto';

@ApiTags('Geography')
@Controller('geography')
export class GeographyController {
  constructor(private geographyService: GeographyService) {}

  @Get('countries')
  @Public()
  @ApiOperation({ summary: 'Liste des pays' })
  getCountries() {
    return this.geographyService.getCountries();
  }

  @Get('countries/:countryId/regions')
  @Public()
  @ApiOperation({ summary: 'Régions d\'un pays' })
  getRegions(@Param('countryId') countryId: string) {
    return this.geographyService.getRegions(countryId);
  }

  @Get('regions/:regionId/cities')
  @Public()
  @ApiOperation({ summary: 'Villes d\'une région' })
  getCities(@Param('regionId') regionId: string) {
    return this.geographyService.getCities(regionId);
  }

  @Get('cities/:cityId/districts')
  @Public()
  @ApiOperation({ summary: 'Communes d\'une ville' })
  getDistricts(@Param('cityId') cityId: string) {
    return this.geographyService.getDistricts(cityId);
  }

  @Get('districts/:districtId/neighborhoods')
  @Public()
  @ApiOperation({ summary: 'Quartiers d\'une commune' })
  getNeighborhoods(@Param('districtId') districtId: string) {
    return this.geographyService.getNeighborhoods(districtId);
  }

  @Post('countries')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un pays (admin)' })
  createCountry(@Body() body: CreateCountryDto) {
    return this.geographyService.createCountry(body);
  }

  @Post('regions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une région (admin)' })
  createRegion(@Body() body: CreateRegionDto) {
    return this.geographyService.createRegion(body);
  }

  @Post('cities')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une ville (admin)' })
  createCity(@Body() body: CreateCityDto) {
    return this.geographyService.createCity(body);
  }

  @Post('districts')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une commune (admin)' })
  createDistrict(@Body() body: CreateDistrictDto) {
    return this.geographyService.createDistrict(body);
  }

  @Post('neighborhoods')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un quartier (admin)' })
  createNeighborhood(@Body() body: CreateNeighborhoodDto) {
    return this.geographyService.createNeighborhood(body);
  }
}
