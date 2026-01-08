import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingItemDto } from './shipping-item.dto';

export class ShippingQuoteDto {
  @ApiPropertyOptional({ description: 'Destination address', example: '123 Main Street, Ho Chi Minh City' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'List of items to ship', type: [ShippingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingItemDto)
  items!: ShippingItemDto[];
}


