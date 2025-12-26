import { IsString, MinLength } from 'class-validator';

export class RenameDeviceDto {
  @IsString()
  @MinLength(1)
  deviceName: string;
}

