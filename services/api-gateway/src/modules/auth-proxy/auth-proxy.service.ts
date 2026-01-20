import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthProxyService {
  /**
   * Base URL cho Auth Service.
   * - Khi chạy Docker: dùng AUTH_SERVICE_URL (ví dụ http://auth-service:3001).
   * - Khi chạy local (npm start): fallback sang http://localhost:3001 để tránh lỗi DNS auth-service.
   */
  private readonly authBaseUrl =
    process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

  constructor(private readonly http: HttpService) {}

  async forwardRegister(body: any) {
    // Chỉ forward email và password, loại bỏ các field không được hỗ trợ (như username)
    const { email, password } = body;
    const registerPayload = { email, password };
    const res = await firstValueFrom(this.http.post(`${this.authBaseUrl}/auth/register`, registerPayload));
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


