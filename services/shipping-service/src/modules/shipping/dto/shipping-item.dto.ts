import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ShippingItemDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  weight?: number;
}


