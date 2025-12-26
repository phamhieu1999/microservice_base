import { IsNumber, IsPositive, IsString } from 'class-validator';

export class CartItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  price: number;
}


