import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Mes professionnels favoris' })
  findMine(@CurrentUser('id') userId: string) {
    return this.favoritesService.getFavoriteProfessionals(userId);
  }

  @Post('professionals/:professionalId')
  @ApiOperation({ summary: 'Ajouter un professionnel aux favoris' })
  add(@CurrentUser('id') userId: string, @Param('professionalId') professionalId: string) {
    return this.favoritesService.addProfessional(userId, professionalId);
  }

  @Delete('professionals/:professionalId')
  @ApiOperation({ summary: 'Retirer un professionnel des favoris' })
  remove(@CurrentUser('id') userId: string, @Param('professionalId') professionalId: string) {
    return this.favoritesService.removeProfessional(userId, professionalId);
  }

  @Get('professionals/:professionalId/check')
  @ApiOperation({ summary: 'Vérifier si un professionnel est en favori' })
  check(@CurrentUser('id') userId: string, @Param('professionalId') professionalId: string) {
    return this.favoritesService.isFavorite(userId, professionalId);
  }
}
