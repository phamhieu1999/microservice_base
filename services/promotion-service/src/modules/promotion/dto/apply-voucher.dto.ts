import { IsNotEmpty, IsString } from 'class-validator';

export class ApplyVoucherDto {
  @IsString()
  @IsNotEmpty()
  voucherId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}


