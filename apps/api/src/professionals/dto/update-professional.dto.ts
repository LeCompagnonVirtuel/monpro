import { IsString, IsOptional, IsInt, Min, Max, IsBoolean, IsArray, ValidateNested, IsNumber, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ProfessionalZoneDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  radiusKm?: number;
}

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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfessionalZoneDto)
  zones?: ProfessionalZoneDto[];
}
