import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShopDto {
  @ApiProperty({
    description: 'Shop name (minimum 3 characters)',
    example: 'Fashion Boutique',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiPropertyOptional({
    description: 'Shop avatar URL',
    example: 'https://example.com/shop-avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Shop address',
    example: '456 Fashion Avenue, Hanoi',
  })
  @IsOptional()
  @IsString()
  address?: string;
}

