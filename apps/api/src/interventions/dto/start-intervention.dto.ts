import { IsArray, IsString } from 'class-validator';

export class StartInterventionDto {
  @IsArray()
  @IsString({ each: true })
  beforePhotos: string[];
}
