import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VerificationStatus } from '@prisma/client';

export class VerifyProfessionalDto {
  @IsEnum(VerificationStatus)
  status: VerificationStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
