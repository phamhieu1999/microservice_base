import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EscalateDisputeDto {
  @ApiProperty({ description: 'User id who escalates' })
  @IsString()
  @IsNotEmpty()
  actorId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
