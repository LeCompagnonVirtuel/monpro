import { IsUUID, IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @IsUUID()
  quoteId: string;

  @IsDate()
  @Type(() => Date)
  scheduledDate: Date;

  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @IsOptional()
  @IsUUID()
  addressId?: string;
}
