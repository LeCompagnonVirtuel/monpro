import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ServicesService } from './services.service';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les services' })
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.servicesService.findAll({ categoryId, subcategoryId, search });
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des services' })
  search(@Query('q') query: string) {
    return this.servicesService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un service' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }
}
