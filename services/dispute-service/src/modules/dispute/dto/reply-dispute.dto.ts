import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReplyDisputeDto {
  @ApiProperty({ description: 'Actor user id (seller or support)' })
  @IsString()
  @IsNotEmpty()
  actorId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;
}
