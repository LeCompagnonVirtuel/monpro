import { IsString, IsOptional, IsUUID, IsEnum, MaxLength } from 'class-validator';
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
  preferredDate?: Date;

  @IsOptional()
  @IsString()
  preferredTimeStart?: string;

  @IsOptional()
  @IsString()
  preferredTimeEnd?: string;
}
