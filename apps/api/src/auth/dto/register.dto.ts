import { IsString, IsOptional, IsEnum, Matches, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: '+2250700000000' })
  @IsString()
  @Matches(/^\+\d{10,15}$/, { message: 'Format de téléphone invalide' })
  phone: string;

  @ApiProperty({ example: 'Kouassi Aman' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.CLIENT })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countryId?: string;
}
