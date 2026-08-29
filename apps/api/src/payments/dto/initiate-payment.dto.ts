import { IsUUID, IsEnum, IsString, Matches } from 'class-validator';
import { PaymentProvider } from '@prisma/client';

export class InitiatePaymentDto {
  @IsUUID()
  bookingId: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsString()
  @Matches(/^\+\d{10,15}$/, { message: 'Format de téléphone invalide' })
  phoneNumber: string;
}
