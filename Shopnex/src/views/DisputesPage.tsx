import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { getDisputesByUser } from '../features/disputes/disputesSlice';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'OPEN':
    case 'ESCALATED':
    case 'SELLER_RESPONDED':
      return 'warning';
    case 'RESOLVED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    default:
      return 'default';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'OPEN':
      return 'Đang mở';
    case 'SELLER_RESPONDED':
      return 'Seller đã phản hồi';
    case 'ESCALATED':
      return 'Đã escalated';
    case 'RESOLVED':
      return 'Đã giải quyết';
    case 'REJECTED':
      return 'Bị từ chối';
    default:
      return status;
  }
}

export function DisputesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authUser = useAppSelector((s) => s.auth.user);
  const isAuthed = useAppSelector((s) => Boolean(s.auth.accessToken));
  const { items, status, error, total } = useAppSelector((s) => s.disputes);

  useEffect(() => {
    if (!isAuthed) {
      navigate('/login');
      return;
    }
    if (authUser?.id) {
      dispatch(getDisputesByUser({ userId: authUser.id, page: 1, limit: 20 }));
    }
  }, [dispatch, isAuthed, authUser?.id, navigate]);

  if (!isAuthed) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Khiếu nại / Tranh chấp</h1>
          <p className="text-sm text-slate-600">Theo dõi trạng thái xử lý các khiếu nại của bạn</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/orders')}>
          Xem đơn hàng
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>
      )}

      {status === 'loading' && items.length === 0 && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="text-sm text-slate-600">Đang tải danh sách khiếu nại…</div>
        </div>
      )}

      {status === 'idle' && items.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <div className="text-sm text-slate-600">Bạn chưa có khiếu nại nào.</div>
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-slate-600">Tổng cộng {total} khiếu nại</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((d) => (
              <Card key={d.id} className="hover:shadow-md transition">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Dispute #{d.id.slice(-8)}</div>
                    <Badge variant={statusVariant(d.status)}>{statusLabel(d.status)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Order</span>
                    <span className="font-medium">{d.orderId.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Lý do</span>
                    <span className="font-medium">{d.reasonCode}</span>
                  </div>
                  {d.createdAt && (
                    <div className="text-xs text-slate-500">
                      Tạo lúc: {new Date(d.createdAt).toLocaleString('vi-VN')}
                    </div>
                  )}
                  <div className="pt-2">
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate(`/orders/${d.orderId}`)}>
                      Xem đơn hàng
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


