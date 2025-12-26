import { Injectable } from '@nestjs/common';
import { AuthService } from '../../../modules/auth/auth.service';
import { LoginDto } from '../../../modules/auth/dto/login.dto';

@Injectable()
export class LoginUserUseCase {
  constructor(private readonly authService: AuthService) {}

  execute(dto: LoginDto, ipAddress?: string, deviceId?: string, userAgent?: string) {
    return this.authService.login(dto, ipAddress, deviceId, userAgent);
  }
}


