import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoyaltyExchangeDto {
  @ApiProperty({ description: 'User ID', example: 'user-123' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Loyalty points to exchange', example: 1000, minimum: 1 })
  @IsInt()
  @Min(1)
  points!: number;
}
