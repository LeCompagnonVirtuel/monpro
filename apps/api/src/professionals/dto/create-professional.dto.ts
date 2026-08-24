import { IsString, IsOptional, IsInt, Min, IsArray } from 'class-validator';

export class CreateProfessionalDto {
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
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];
}
