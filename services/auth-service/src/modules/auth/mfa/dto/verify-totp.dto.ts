import { IsString, Length } from 'class-validator';

export class VerifyTOTPDto {
  @IsString()
  @Length(6, 6)
  token: string;
}

