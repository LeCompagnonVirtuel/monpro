import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '+2250700000000' })
  @IsString()
  @Matches(/^\+\d{10,15}$/, { message: 'Format de téléphone invalide' })
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Le code OTP doit contenir 6 chiffres' })
  code: string;
}
