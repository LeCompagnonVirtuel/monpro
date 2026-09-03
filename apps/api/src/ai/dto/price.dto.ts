import { IsString, IsOptional, IsNumber } from 'class-validator';

export class EstimatePriceDto {
  @IsString()
  serviceId: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}
