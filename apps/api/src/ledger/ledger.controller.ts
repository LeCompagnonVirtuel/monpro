import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Ledger')
@Controller('ledger')
@ApiBearerAuth()
export class LedgerController {
  constructor(private ledgerService: LedgerService) {}

  @Get('wallet')
  @ApiOperation({ summary: 'Portefeuille du professionnel connecté' })
  getMyWallet(@CurrentUser('id') userId: string) {
    return this.ledgerService.getProfessionalWallet(userId);
  }

  @Get('admin/balance/:accountId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Balance d\'un compte (admin)' })
  getBalance(@Param('accountId') accountId: string) {
    return this.ledgerService.getBalance(accountId);
  }

  @Get('admin/payment/:paymentId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Écritures d\'un paiement (admin)' })
  getPaymentEntries(@Param('paymentId') paymentId: string) {
    return this.ledgerService.getEntriesByPayment(paymentId);
  }
}
