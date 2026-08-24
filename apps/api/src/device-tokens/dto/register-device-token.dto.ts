import { IsString, IsEnum, IsOptional } from 'class-validator';
import { DevicePlatform } from '@prisma/client';

export class RegisterDeviceTokenDto {
  @IsString()
  token: string;

  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
