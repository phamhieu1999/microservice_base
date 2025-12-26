import { Injectable } from '@nestjs/common';
import { AuthProxyService } from '../../auth-proxy/auth-proxy.service';

@Injectable()
export class ProxyRefreshUseCase {
  constructor(private readonly authProxy: AuthProxyService) {}

  execute(body: any) {
    return this.authProxy.forwardRefresh(body);
  }
}


