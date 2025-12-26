import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ApplyReferralDto {
  @ApiProperty({ description: 'Referral code to apply', example: 'ABC12345' })
  @IsString()
  @IsNotEmpty()
  referralCode: string;
}

