import { Injectable } from '@nestjs/common';
import { AuthProxyService } from '../../../modules/auth-proxy/auth-proxy.service';

@Injectable()
export class ProxyLogoutUseCase {
  constructor(private readonly authProxy: AuthProxyService) {}

  execute(authorizationHeader: string) {
    return this.authProxy.forwardLogout(authorizationHeader);
  }
}


