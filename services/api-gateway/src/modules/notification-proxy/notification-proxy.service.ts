import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationProxyService {
  private readonly notificationBaseUrl =
    process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005';

  constructor(private readonly http: HttpService) {}

  async forwardList(authorization: string) {
    const res = await firstValueFrom(
      this.http.get(`${this.notificationBaseUrl}/notifications`, {
        headers: { authorization },
      }),
    );
    return res.data;
  }

  async forwardUnreadCount(authorization: string) {
    const res = await firstValueFrom(
      this.http.get(`${this.notificationBaseUrl}/notifications/unread-count`, {
        headers: { authorization },
      }),
    );
    return res.data;
  }

  async forwardMarkAsRead(authorization: string, id: string) {
    const res = await firstValueFrom(
      this.http.post(`${this.notificationBaseUrl}/notifications/${id}/read`, null, {
        headers: { authorization },
      }),
    );
    return res.data;
  }
}

