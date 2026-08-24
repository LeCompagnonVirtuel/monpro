import { IsNumber, IsOptional, IsUUID, IsBoolean, Min, Max } from 'class-validator';

export class CreateCommissionDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  rate: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
