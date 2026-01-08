import { ApiProperty } from '@nestjs/swagger';

export class RetryResponseDto {
  @ApiProperty({ description: 'Whether retry was successful' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Delay in milliseconds before retry', required: false })
  delayMs?: number;
}

