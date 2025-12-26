import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateReferralDto {
  @ApiProperty({ description: 'Custom referral code (optional, will be generated if not provided)', required: false })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

