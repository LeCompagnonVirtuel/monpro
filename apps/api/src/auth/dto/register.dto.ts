import { IsString, IsOptional, IsEnum, Matches, MinLength, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: '+2250700000000' })
  @IsString()
  @Matches(/^\+\d{10,15}$/, { message: 'Format de téléphone invalide' })
  phone: string;

  @ApiProperty({ example: 'Kouassi Aman' })
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut dépasser 100 caractères' })
  @Matches(/^[\p{L}\s'-]+$/u, { message: 'Le nom contient des caractères invalides' })
  fullName: string;

  @ApiPropertyOptional({ enum: [UserRole.CLIENT, UserRole.PROFESSIONAL], default: UserRole.CLIENT })
  @IsOptional()
  @IsEnum([UserRole.CLIENT, UserRole.PROFESSIONAL], { message: 'Rôle invalide' })
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'ID ville invalide' })
  cityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'ID pays invalide' })
  countryId?: string;
}
