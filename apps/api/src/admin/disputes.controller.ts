import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DisputesService } from './disputes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, DisputeStatus } from '@prisma/client';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { CreateReportDto } from './dto/create-report.dto';

@ApiTags('Disputes & Reports')
@Controller('disputes')
export class DisputesController {
  constructor(private disputesService: DisputesService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Signaler un litige' })
  create(@CurrentUser('id') userId: string, @Body() body: CreateDisputeDto) {
    return this.disputesService.create(userId, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les litiges (admin)' })
  findAll(@Query('status') status?: DisputeStatus, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.disputesService.findAll({ status, page, limit });
  }

  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Résoudre un litige (admin)' })
  resolve(@Param('id') id: string, @CurrentUser('id') adminId: string, @Body() body: ResolveDisputeDto) {
    return this.disputesService.resolve(id, adminId, body.resolution);
  }

  @Post('reports')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Signaler un utilisateur' })
  createReport(@CurrentUser('id') userId: string, @Body() body: CreateReportDto) {
    return this.disputesService.createReport(userId, body);
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Signalements en attente (admin)' })
  getReports(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.disputesService.getReports(page, limit);
  }

  @Patch('reports/:id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Résoudre un signalement (admin)' })
  resolveReport(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.disputesService.resolveReport(id, adminId);
  }
}
