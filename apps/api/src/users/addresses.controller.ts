import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Addresses')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressesController {
  constructor(private addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Mes adresses' })
  findMine(@CurrentUser('id') userId: string) {
    return this.addressesService.findByUser(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Ajouter une adresse' })
  create(@CurrentUser('id') userId: string, @Body() body: CreateAddressDto) {
    return this.addressesService.create(userId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une adresse' })
  update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() body: UpdateAddressDto) {
    return this.addressesService.update(id, userId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une adresse' })
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.addressesService.delete(id, userId);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Définir comme adresse par défaut' })
  setDefault(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.addressesService.setDefault(id, userId);
  }
}
