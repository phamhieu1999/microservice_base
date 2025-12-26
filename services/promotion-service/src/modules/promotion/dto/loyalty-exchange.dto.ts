import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class LoyaltyExchangeDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsInt()
  @Min(1)
  points: number;
}
