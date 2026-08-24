import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateQuoteDto } from './dto/create-quote.dto';

@ApiTags('Quotes')
@Controller('quotes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuotesController {
  constructor(private quotesService: QuotesService) {}

  @Post()
  @ApiOperation({ summary: 'Envoyer un devis (professionnel)' })
  create(@CurrentUser('id') professionalId: string, @Body() body: CreateQuoteDto) {
    return this.quotesService.create(professionalId, body);
  }

  @Get('request/:requestId')
  @ApiOperation({ summary: 'Devis pour une demande' })
  findByRequest(@Param('requestId') requestId: string) {
    return this.quotesService.findByRequest(requestId);
  }

  @Get('professional/:professionalId')
  @ApiOperation({ summary: 'Mes devis envoyés (professionnel)' })
  findByProfessional(
    @Param('professionalId') professionalId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.quotesService.findByProfessional(professionalId, page, limit);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accepter un devis (client)' })
  accept(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.quotesService.accept(id, userId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Refuser un devis (client)' })
  reject(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.quotesService.reject(id, userId);
  }
}
