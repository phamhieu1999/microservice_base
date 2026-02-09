import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayoutStatus } from '../../../database/entities/payout-request.entity';

export class UpdatePayoutStatusDto {
  @ApiProperty({
    description: 'New payout status. APPROVED: approved but not yet paid, PAID: payment completed, REJECTED: payout rejected and amount returned to available balance',
    enum: ['APPROVED', 'PAID', 'REJECTED'],
    example: 'APPROVED',
    type: String,
  })
  @IsEnum(['APPROVED', 'PAID', 'REJECTED'])
  status!: PayoutStatus;

  @ApiPropertyOptional({
    description: 'Optional note explaining the status change',
    example: 'Payout approved and processed',
    type: String,
  })
  @IsOptional()
  @IsString()
  note?: string;
}

