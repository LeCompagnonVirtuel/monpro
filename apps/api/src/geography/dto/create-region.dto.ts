import { IsString, IsUUID } from 'class-validator';

export class CreateRegionDto {
  @IsString()
  name: string;

  @IsUUID()
  countryId: string;
}
