import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShippingOrderDto {
  @ApiProperty({ description: 'Order ID', example: 'order-123' })
  @IsString()
  orderId!: string;

  @ApiProperty({ description: 'Shipping quote ID', example: 'quote-456' })
  @IsString()
  quoteId!: string;

  @ApiProperty({ description: 'Destination address', example: '123 Main Street, Ho Chi Minh City' })
  @IsString()
  destinationAddress!: string;

  @ApiPropertyOptional({ description: 'Origin address', example: '456 Warehouse Street, Hanoi' })
  @IsOptional()
  @IsString()
  originAddress?: string;

  @ApiPropertyOptional({ description: 'Recipient name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  recipientName?: string;

  @ApiPropertyOptional({ description: 'Recipient phone', example: '+84901234567' })
  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @ApiPropertyOptional({ description: 'Carrier name', example: 'Vietnam Post' })
  @IsOptional()
  @IsString()
  carrier?: string;
}

