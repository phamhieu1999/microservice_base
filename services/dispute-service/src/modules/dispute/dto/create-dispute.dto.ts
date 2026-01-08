import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDisputeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sellerId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reasonCode!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: 'JSON attachments metadata' })
  @IsOptional()
  attachments?: any;
}
