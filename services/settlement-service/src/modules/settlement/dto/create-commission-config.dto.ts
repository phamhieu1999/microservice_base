import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommissionConfigDto {
  @ApiPropertyOptional({
    description: 'Seller ID if this commission is specific to a seller. Either sellerId or categoryId must be provided, but not both.',
    example: 'seller-1',
    type: String,
  })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional({
    description: 'Category ID if this commission is specific to a category. Either sellerId or categoryId must be provided, but not both.',
    example: 'electronics',
    type: String,
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    description: 'Commission rate as decimal. 0.01 = 1%, 0.1 = 10%, 0.15 = 15%, max 1.0 = 100%',
    example: 0.15,
    minimum: 0,
    maximum: 1,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate!: number;
}

