import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getShippingByTrackingNumber, getShippingByOrderId } from '../features/shipping/shippingSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Package, MapPin, Calendar, Truck } from 'lucide-react';

export function ShippingTrackingPage() {
  const { trackingNumber, orderId } = useParams<{ trackingNumber?: string; orderId?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentShippingOrder, status, error } = useAppSelector((s) => s.shipping);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (trackingNumber) {
      dispatch(getShippingByTrackingNumber(trackingNumber));
    } else if (orderId) {
      dispatch(getShippingByOrderId(orderId));
    }
  }, [dispatch, trackingNumber, orderId]);

  // Auto refresh nếu shipping đang trong quá trình vận chuyển
  useEffect(() => {
    if (!autoRefresh || !currentShippingOrder) return;
    if (
      currentShippingOrder.status === 'DELIVERED' ||
      currentShippingOrder.status === 'CANCELLED' ||
      currentShippingOrder.status === 'RETURNED'
    ) {
      setAutoRefresh(false);
      return;
    }

    const interval = setInterval(() => {
      if (trackingNumber) {
        dispatch(getShippingByTrackingNumber(trackingNumber));
      } else if (orderId) {
        dispatch(getShippingByOrderId(orderId));
      }
    }, 10000); // Refresh mỗi 10 giây

    return () => clearInterval(interval);
  }, [autoRefresh, trackingNumber, orderId, currentShippingOrder, dispatch]);

  const handleRefresh = () => {
    if (trackingNumber) {
      dispatch(getShippingByTrackingNumber(trackingNumber));
    } else if (orderId) {
      dispatch(getShippingByOrderId(orderId));
    }
  };

  if (status === 'loading' && !currentShippingOrder) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-sm text-slate-600">Đang tải thông tin vận chuyển…</div>
      </div>
    );
  }

  if (error || !currentShippingOrder) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="text-sm text-red-600">
          {error || 'Không tìm thấy thông tin vận chuyển'}
        </div>
        {orderId && (
          <Button variant="secondary" onClick={() => navigate(`/orders/${orderId}`)}>
            Quay lại đơn hàng
          </Button>
        )}
        <Button variant="secondary" onClick={() => navigate('/orders')}>
          Danh sách đơn hàng
        </Button>
      </div>
    );
  }

  const shipping = currentShippingOrder;
  const isDelivered = shipping.status === 'DELIVERED';
  const isInTransit = shipping.status === 'IN_TRANSIT';
  const isPending = shipping.status === 'PENDING' || shipping.status === 'CONFIRMED';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Theo dõi vận chuyển</h1>
          <p className="text-sm text-slate-600">
            API: <code className="rounded bg-slate-100 px-1">GET /shipping/tracking/:trackingNumber</code>
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={status === 'loading'}>
          Làm mới
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking Number */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Mã vận đơn</div>
                  <div className="mt-1 font-mono text-lg font-semibold">{shipping.trackingNumber}</div>
                </div>
                <Badge variant={getStatusVariant(shipping.status)}>
                  {getStatusLabel(shipping.status)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Tracking History */}
          {shipping.trackingHistory && shipping.trackingHistory.length > 0 && (
            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">Lịch sử vận chuyển</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shipping.trackingHistory.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            index === 0 ? 'bg-[#ee4d2d]' : 'bg-slate-300'
                          }`}
                        />
                        {index < shipping.trackingHistory!.length - 1 && (
                          <div className="h-12 w-0.5 bg-slate-200" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold">{getStatusLabel(event.status)}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(event.timestamp).toLocaleString('vi-VN')}
                          </div>
                        </div>
                        {event.location && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-slate-600">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                        {event.note && (
                          <div className="mt-1 text-xs text-slate-500">{event.note}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipping Details */}
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Thông tin vận chuyển</div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 mt-0.5 text-slate-400" />
                <div className="flex-1">
                  <div className="text-slate-600">Phương thức</div>
                  <div className="font-medium">{shipping.methodName || 'Standard Shipping'}</div>
                </div>
              </div>
              {shipping.carrier && (
                <div className="flex items-start gap-2">
                  <Truck className="h-4 w-4 mt-0.5 text-slate-400" />
                  <div className="flex-1">
                    <div className="text-slate-600">Đơn vị vận chuyển</div>
                    <div className="font-medium">{shipping.carrier}</div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-slate-400" />
                <div className="flex-1">
                  <div className="text-slate-600">Địa chỉ giao hàng</div>
                  <div className="font-medium">{shipping.destinationAddress}</div>
                </div>
              </div>
              {shipping.estimatedDeliveryDate && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-slate-400" />
                  <div className="flex-1">
                    <div className="text-slate-600">Dự kiến giao hàng</div>
                    <div className="font-medium">
                      {new Date(shipping.estimatedDeliveryDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              )}
              {shipping.actualDeliveryDate && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-emerald-500" />
                  <div className="flex-1">
                    <div className="text-slate-600">Ngày giao hàng</div>
                    <div className="font-medium text-emerald-600">
                      {new Date(shipping.actualDeliveryDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Thao tác</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {shipping.orderId && (
                <Button
                  className="w-full"
                  onClick={() => navigate(`/orders/${shipping.orderId}`)}
                >
                  Xem đơn hàng
                </Button>
              )}
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate('/orders')}
              >
                Danh sách đơn hàng
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' {
  switch (status?.toUpperCase()) {
    case 'DELIVERED':
      return 'success';
    case 'PENDING':
    case 'CONFIRMED':
      return 'warning';
    case 'IN_TRANSIT':
      return 'default';
    case 'CANCELLED':
    case 'RETURNED':
      return 'danger';
    default:
      return 'default';
  }
}

function getStatusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return 'Chờ xử lý';
    case 'CONFIRMED':
      return 'Đã xác nhận';
    case 'IN_TRANSIT':
      return 'Đang vận chuyển';
    case 'DELIVERED':
      return 'Đã giao hàng';
    case 'CANCELLED':
      return 'Đã hủy';
    case 'RETURNED':
      return 'Đã trả lại';
    default:
      return status;
  }
}

