import { IsString, IsOptional, IsUUID, IsEnum, MaxLength, IsArray, IsNumber, Min, Max } from 'class-validator';
import { UrgencyLevel } from '@prisma/client';

export class CreateServiceRequestDto {
  @IsUUID()
  serviceId: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

  @IsOptional()
  @IsUUID()
  addressId?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  preferredDate?: Date;

  @IsOptional()
  @IsString()
  preferredTimeStart?: string;

  @IsOptional()
  @IsString()
  preferredTimeEnd?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];
}
