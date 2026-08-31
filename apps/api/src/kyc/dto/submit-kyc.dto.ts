import { IsEnum, IsString, IsOptional, IsUrl } from 'class-validator';
import { KycDocumentType } from '@prisma/client';

export class SubmitKycDto {
  @IsEnum(KycDocumentType)
  documentType: KycDocumentType;

  @IsString()
  documentNumber: string;

  @IsUrl()
  frontUrl: string;

  @IsUrl()
  @IsOptional()
  backUrl?: string;

  @IsUrl()
  selfieUrl: string;
}
