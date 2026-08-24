import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { AddMemberDto } from './dto/add-member.dto';

@ApiTags('Businesses')
@Controller('businesses')
@ApiBearerAuth()
export class BusinessesController {
  constructor(private businessesService: BusinessesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une entreprise' })
  create(@CurrentUser('id') userId: string, @Body() body: CreateBusinessDto) {
    return this.businessesService.create(userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Mes entreprises' })
  findMine(@CurrentUser('id') userId: string) {
    return this.businessesService.findByOwner(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail entreprise' })
  findOne(@Param('id') id: string) {
    return this.businessesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier entreprise' })
  update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() body: UpdateBusinessDto) {
    return this.businessesService.update(id, userId, body);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Ajouter un membre' })
  addMember(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() body: AddMemberDto) {
    return this.businessesService.addMember(id, userId, body.professionalId, body.role);
  }

  @Delete(':id/members/:professionalId')
  @ApiOperation({ summary: 'Retirer un membre' })
  removeMember(@Param('id') id: string, @Param('professionalId') professionalId: string, @CurrentUser('id') userId: string) {
    return this.businessesService.removeMember(id, userId, professionalId);
  }
}
