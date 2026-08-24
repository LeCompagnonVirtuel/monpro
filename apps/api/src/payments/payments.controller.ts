import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaymentProvider } from '@prisma/client';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initier un paiement' })
  initiate(@Body() body: { bookingId: string; provider: PaymentProvider; phoneNumber: string }) {
    return this.paymentsService.initiate(body.bookingId, body.provider, body.phoneNumber);
  }

  @Post('webhook/:provider')
  @ApiOperation({ summary: 'Webhook paiement (appelé par le fournisseur)' })
  webhook(@Param('provider') provider: PaymentProvider, @Body() payload: any) {
    return this.paymentsService.handleWebhook(provider, payload);
  }

  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Paiement d\'une réservation' })
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.findByBooking(bookingId);
  }
}
