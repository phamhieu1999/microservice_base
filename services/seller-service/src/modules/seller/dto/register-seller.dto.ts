import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterSellerDto {
  @ApiProperty({
    description: 'Shop name (minimum 3 characters)',
    example: 'Tech Store',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  shopName!: string;

  @ApiPropertyOptional({
    description: 'Shop avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Shop address',
    example: '123 Main Street, Ho Chi Minh City',
  })
  @IsOptional()
  @IsString()
  address?: string;
}


