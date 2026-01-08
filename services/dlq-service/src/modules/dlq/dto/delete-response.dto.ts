import { ApiProperty } from '@nestjs/swagger';

export class DeleteResponseDto {
  @ApiProperty({ description: 'Whether deletion was successful' })
  success: boolean;
}

