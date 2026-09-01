import { IsString, MinLength } from 'class-validator';

export class RefundPaymentDto {
  @IsString()
  @MinLength(5, { message: 'Le motif doit contenir au moins 5 caractères' })
  reason: string;
}
