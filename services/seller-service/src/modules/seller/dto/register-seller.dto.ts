import { IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterSellerDto {
  @IsString()
  @MinLength(3)
  shopName: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  address?: string;
}


