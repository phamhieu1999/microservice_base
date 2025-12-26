import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ChatProxyService {
  private readonly chatBaseUrl = process.env.CHAT_SERVICE_URL || 'http://chat-service:3011';

  constructor(private readonly http: HttpService) {}

  async createConversation(authorization: string, body: any) {
    const res = await firstValueFrom(
      this.http.post(`${this.chatBaseUrl}/conversations`, body, {
        headers: { Authorization: authorization },
      }),
    );
    return res.data;
  }

  async listConversations(authorization: string) {
    const res = await firstValueFrom(
      this.http.get(`${this.chatBaseUrl}/conversations`, {
        headers: { Authorization: authorization },
      }),
    );
    return res.data;
  }

  async sendMessage(authorization: string, id: string, body: any) {
    const res = await firstValueFrom(
      this.http.post(`${this.chatBaseUrl}/conversations/${id}/messages`, body, {
        headers: { Authorization: authorization },
      }),
    );
    return res.data;
  }

  async listMessages(authorization: string, id: string) {
    const res = await firstValueFrom(
      this.http.get(`${this.chatBaseUrl}/conversations/${id}/messages`, {
        headers: { Authorization: authorization },
      }),
    );
    return res.data;
  }
}


