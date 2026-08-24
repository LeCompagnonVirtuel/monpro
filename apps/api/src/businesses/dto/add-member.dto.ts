import { IsUUID, IsOptional, IsString } from 'class-validator';

export class AddMemberDto {
  @IsUUID()
  professionalId: string;

  @IsOptional()
  @IsString()
  role?: string;
}
