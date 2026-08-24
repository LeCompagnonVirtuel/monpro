import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, BookingStatus, PaymentStatus } from '@prisma/client';
import { VerifyProfessionalDto } from './dto/verify-professional.dto';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Statistiques dashboard' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('verifications')
  @ApiOperation({ summary: 'Vérifications en attente' })
  getPendingVerifications(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getPendingVerifications(page, limit);
  }

  @Patch('verifications/:id')
  @ApiOperation({ summary: 'Valider/rejeter un professionnel' })
  verify(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() body: VerifyProfessionalDto,
  ) {
    return this.adminService.verifyProfessional(id, adminId, body.status, body.reason);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Activité récente' })
  getActivity(@Query('limit') limit?: number) {
    return this.adminService.getRecentActivity(limit);
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Configuration commissions' })
  getCommissions() {
    return this.adminService.getCommissionConfigs();
  }

  @Post('commissions')
  @ApiOperation({ summary: 'Créer une commission' })
  createCommission(@Body() body: CreateCommissionDto) {
    return this.adminService.createCommission(body);
  }

  @Patch('commissions/:id')
  @ApiOperation({ summary: 'Modifier une commission' })
  updateCommission(@Param('id') id: string, @Body() body: UpdateCommissionDto) {
    return this.adminService.updateCommission(id, body.rate);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Toutes les réservations' })
  getAllBookings(@Query('status') status?: BookingStatus, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAllBookings({ status, page, limit });
  }

  @Get('payments')
  @ApiOperation({ summary: 'Tous les paiements' })
  getAllPayments(@Query('status') status?: PaymentStatus, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAllPayments({ status, page, limit });
  }
}
