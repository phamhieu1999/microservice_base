import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestPayoutDto {
  @ApiProperty({
    description: 'Payout amount in VND (must be greater than 0.01)',
    example: 1000000,
    minimum: 0.01,
    type: Number,
  })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({
    description: 'Optional note for the payout request',
    example: 'Monthly payout request',
    type: String,
  })
  @IsOptional()
  @IsString()
  note?: string;
}

