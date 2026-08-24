import { IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateDisputeDto {
  @IsUUID()
  bookingId: string;

  @IsString()
  @MaxLength(200)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
