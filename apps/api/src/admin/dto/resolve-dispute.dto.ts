import { IsString, MaxLength } from 'class-validator';

export class ResolveDisputeDto {
  @IsString()
  @MaxLength(2000)
  resolution: string;
}
