import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CartItemDto {
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
}


