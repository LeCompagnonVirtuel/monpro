import { Controller, Post, Get, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Donner un avis' })
  create(@CurrentUser('id') userId: string, @Body() body: CreateReviewDto) {
    return this.reviewsService.create(userId, body);
  }

  @Get('professional/:professionalId')
  @ApiOperation({ summary: 'Avis d\'un professionnel' })
  findByProfessional(
    @Param('professionalId') professionalId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.findByProfessional(professionalId, page, limit);
  }

  @Patch(':id/respond')
  @ApiOperation({ summary: 'Répondre à un avis (professionnel)' })
  respond(@Param('id') id: string, @CurrentUser('id') professionalId: string, @Body('response') response: string) {
    return this.reviewsService.respond(id, professionalId, response);
  }
}
