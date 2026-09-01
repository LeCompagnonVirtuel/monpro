import { IsString, IsEmail, MinLength, MaxLength, Matches, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @ApiProperty({ example: 'MotDePasse123!' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(128, { message: 'Le mot de passe ne peut dépasser 128 caractères' })
  password: string;

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
