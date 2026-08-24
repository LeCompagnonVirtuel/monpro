import { IsArray, IsString, IsOptional } from 'class-validator';

export class CompleteInterventionDto {
  @IsArray()
  @IsString({ each: true })
  afterPhotos: string[];

  @IsOptional()
  @IsString()
  completionNotes?: string;
}
