import { IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class UpdateProfessionalDto {
  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
