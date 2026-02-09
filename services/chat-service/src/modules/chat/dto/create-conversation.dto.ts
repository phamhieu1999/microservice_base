import { IsString } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  sellerId!: string;
}


