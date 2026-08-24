import { Controller, Post, Get, Param, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaymentProvider } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private providerFactory: PaymentProviderFactory,
  ) {}

  @Post()
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
}
