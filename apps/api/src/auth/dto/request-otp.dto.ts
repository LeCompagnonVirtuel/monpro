import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({ example: '+2250700000000', description: 'Numéro de téléphone avec indicatif' })
  @IsString()
  @Matches(/^\+\d{10,15}$/, { message: 'Format de téléphone invalide' })
  phone: string;
}
