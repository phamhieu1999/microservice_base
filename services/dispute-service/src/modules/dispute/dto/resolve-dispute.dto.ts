import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ResolveDisputeDto {
  @ApiProperty({ description: 'Admin user id who resolves' })
  @IsString()
  @IsNotEmpty()
  actorId!: string;

  @ApiProperty({ enum: ['RESOLVED', 'REJECTED'] })
  @IsString()
  @IsIn(['RESOLVED', 'REJECTED'])
  decision!: 'RESOLVED' | 'REJECTED';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resolution?: string;
}
