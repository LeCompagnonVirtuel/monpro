import { IsString } from 'class-validator';

export class DiagnoseDto {
  @IsString()
  imageBase64: string;
}
