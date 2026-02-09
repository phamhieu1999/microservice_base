import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  clearNotifications,
} from '../features/notifications/notificationsSlice';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Bell, Check } from 'lucide-react';

export function NotificationsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, status, total } = useAppSelector((s) => s.notifications);
  const isAuthed = useAppSelector((s) => Boolean(s.auth.accessToken));

  useEffect(() => {
    if (!isAuthed) {
      navigate('/login');
      return;
    }
    dispatch(fetchNotifications({ page: 1, limit: 20 }));
    dispatch(fetchUnreadCount());

    return () => {
      dispatch(clearNotifications());
    };
  }, [dispatch, isAuthed, navigate]);

  if (!isAuthed) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Thông báo</h1>
        <p className="text-sm text-slate-600">
          Xem các thông báo về đơn hàng, thanh toán và hoạt động tài khoản.
        </p>
      </div>

      {status === 'loading' && items.length === 0 && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="text-sm text-slate-600">Đang tải thông báo…</div>
        </div>
      )}

      {items.length === 0 && status === 'idle' && (
        <Card>
          <CardContent className="py-10 text-center">
            <div className="flex flex-col items-center gap-2">
              <Bell className="h-6 w-6 text-slate-400" />
              <div className="text-sm text-slate-600">Hiện chưa có thông báo nào.</div>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <>
          <div className="text-sm text-slate-600">Tổng cộng {total} thông báo</div>
          <div className="space-y-3">
            {items.map((n) => (
              <Card
                key={n.id}
                className={n.read ? 'border-slate-200 bg-white' : 'border-[#ee4d2d]/30 bg-[#fff7f5]'}
              >
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{n.title}</span>
                      {!n.read && <Badge variant="warning">Mới</Badge>}
                    </div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">{n.content}</div>
                    {n.createdAt && (
                      <div className="text-xs text-slate-500">
                        {new Date(n.createdAt).toLocaleString('vi-VN')}
                      </div>
                    )}
                  </div>
                  {!n.read && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => dispatch(markNotificationAsRead(n.id))}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Đã đọc
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


