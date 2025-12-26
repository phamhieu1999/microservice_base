// Skeleton use case: hiện tại ủy quyền cho AuthService cũ để không phá logic,
// dùng làm bước đệm refactor sang domain/infrastructure sau này.
import { Injectable } from '@nestjs/common';
import { AuthService } from '../../../modules/auth/auth.service';
import { RegisterDto } from '../../../modules/auth/dto/register.dto';

@Injectable()
export class RegisterUserUseCase {
  constructor(private readonly authService: AuthService) {}

  execute(dto: RegisterDto) {
    return this.authService.register(dto);
  }
}


