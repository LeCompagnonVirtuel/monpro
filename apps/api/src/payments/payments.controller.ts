import { Controller, Post, Get, Patch, Param, Body, Headers, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { PaymentProvider } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private providerFactory: PaymentProviderFactory,
  ) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initier un paiement' })
  initiate(
    @CurrentUser('id') userId: string,
    @Body() body: InitiatePaymentDto,
  ) {
    return this.paymentsService.initiate(body.bookingId, body.provider, body.phoneNumber, userId);
  }

  @Post('webhook/:provider')
  @Public()
  @ApiOperation({ summary: 'Webhook paiement (appelé par le fournisseur)' })
  webhook(
    @Param('provider') provider: PaymentProvider,
    @Body() payload: any,
    @Headers('x-webhook-signature') signature: string,
  ) {
    const paymentProvider = this.providerFactory.getProvider(provider);
    if (!paymentProvider.verifyWebhookSignature(payload, signature)) {
      throw new UnauthorizedException('Signature webhook invalide');
    }
    return this.paymentsService.handleWebhook(provider, payload);
  }

  @Get('booking/:bookingId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Paiement d\'une réservation' })
  findByBooking(@Param('bookingId') bookingId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.findByBooking(bookingId, userId);
  }

  @Get(':id/poll')
  @Throttle({ default: { ttl: 30000, limit: 10 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vérifier le statut du paiement' })
  pollStatus(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.pollStatus(id, userId);
  }

  @Patch(':id/refund')
  @Throttle({ default: { ttl: 300000, limit: 3 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rembourser un paiement' })
  refund(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: RefundPaymentDto,
  ) {
    return this.paymentsService.refund(id, body.reason, userId);
  }
}
