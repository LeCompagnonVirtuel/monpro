import { IsString, IsUUID } from 'class-validator';

export class CreateDistrictDto {
  @IsString()
  name: string;

  @IsUUID()
  cityId: string;
}
