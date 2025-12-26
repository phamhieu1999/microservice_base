import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../../modules/auth/auth.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return this.authService.refreshToken(refreshToken);
  }
}


