import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectKycDto {
  @ApiProperty({ example: 'Document illisible' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
