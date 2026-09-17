import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePositionDto {
  @ApiProperty({ description: 'Latitude', example: 5.36 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: -4.0083 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
