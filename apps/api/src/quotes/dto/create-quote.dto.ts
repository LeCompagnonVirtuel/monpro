import { IsString, IsOptional, IsUUID, IsInt, Min, IsDateString } from 'class-validator';

export class CreateQuoteDto {
  @IsUUID()
  serviceRequestId: string;

  @IsInt()
  @Min(0)
  laborCost: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  materialCost?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  transportCost?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  estimatedDuration?: string;

  @IsOptional()
  validUntil?: Date;
}
