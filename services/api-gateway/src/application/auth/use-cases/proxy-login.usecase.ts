// Skeleton use case: tách logic proxy login ra khỏi controller.
import { Injectable } from '@nestjs/common';
import { AuthProxyService } from '../../auth-proxy/auth-proxy.service';

@Injectable()
export class ProxyLoginUseCase {
  constructor(private readonly authProxy: AuthProxyService) {}

  execute(body: any) {
    return this.authProxy.forwardLogin(body);
  }
}


