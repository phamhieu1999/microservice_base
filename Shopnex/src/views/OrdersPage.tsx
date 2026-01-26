import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function OrdersPage() {
  const navigate = useNavigate();
  const { orders, currentOrder } = useAppSelector((s) => s.orders);

  // Hiển thị danh sách orders từ state
  // Trong thực tế, cần thêm API để lấy danh sách orders của user
  const displayOrders = orders.length > 0 ? orders : (currentOrder ? [currentOrder] : []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Đơn hàng của tôi</h1>
        <p className="text-sm text-slate-600">
          Xem lịch sử và chi tiết các đơn hàng đã đặt
        </p>
      </div>

      {displayOrders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <div className="text-sm text-slate-600">Chưa có đơn hàng nào.</div>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => navigate('/products')}
            >
              Mua sắm ngay
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold">Đơn hàng #{order.id.slice(-8)}</span>
                      <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString('vi-VN')
                        : 'Chưa có thời gian'}
                    </div>
                    <div className="text-sm text-slate-600">
                      {order.items.length} sản phẩm • Tổng: ${order.totalAmount?.toFixed(2) ?? '0.00'}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return 'warning';
    case 'CONFIRMED':
    case 'PROCESSING':
      return 'default';
    case 'SHIPPED':
    case 'DELIVERED':
      return 'success';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'danger';
    default:
      return 'default';
  }
}

