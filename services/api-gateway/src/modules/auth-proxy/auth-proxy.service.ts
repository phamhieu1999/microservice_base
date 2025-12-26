import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthProxyService {
  private readonly authBaseUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

  constructor(private readonly http: HttpService) {}

  async forwardRegister(body: any) {
    const res = await firstValueFrom(this.http.post(`${this.authBaseUrl}/auth/register`, body));
    return res.data;
  }

  async forwardLogin(body: any) {
    const res = await firstValueFrom(this.http.post(`${this.authBaseUrl}/auth/login`, body));
    return res.data;
  }

  async forwardRefresh(body: any) {
    const res = await firstValueFrom(this.http.post(`${this.authBaseUrl}/auth/refresh`, body));
    return res.data;
  }

  async forwardLogout(authorizationHeader: string) {
    const res = await firstValueFrom(
      this.http.post(
        `${this.authBaseUrl}/auth/logout`,
        {},
        {
          headers: {
            Authorization: authorizationHeader,
          },
        },
      ),
    );
    return res.data;
  }
}


