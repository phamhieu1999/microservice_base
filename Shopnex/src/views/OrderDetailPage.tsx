import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder } from '../features/orders/ordersSlice';
import { getShippingByOrderId, clearShippingOrder } from '../features/shipping/shippingSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createDispute } from '../features/disputes/disputesSlice';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Package, MessageCircle } from 'lucide-react';
import { Input } from '../ui/Input';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentOrder, status, error } = useAppSelector((s) => s.orders);
  const { currentShippingOrder } = useAppSelector((s) => s.shipping);
  const authUser = useAppSelector((s) => s.auth.user);
  const { createStatus: disputeCreateStatus, error: disputeError } = useAppSelector((s) => s.disputes);

  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [reasonCode, setReasonCode] = useState('DAMAGED_ITEM');
  const [disputeDescription, setDisputeDescription] = useState('');

  useEffect(() => {
    if (id) {
      dispatch(getOrder(id));
      dispatch(clearShippingOrder());
      dispatch(getShippingByOrderId(id));
    }
  }, [dispatch, id]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-sm text-slate-600">Đang tải đơn hàng…</div>
      </div>
    );
  }

  if (error || !currentOrder) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="text-sm text-red-600">{error || 'Không tìm thấy đơn hàng'}</div>
        <Button variant="secondary" onClick={() => navigate('/orders')}>
          Quay lại danh sách đơn hàng
        </Button>
      </div>
    );
  }

  const order = currentOrder;
  const subTotal = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const total = subTotal + (order.shippingFee ?? 0) - (order.discountAmount ?? 0);

  const sellerId = useMemo(() => {
    // lấy sellerId từ item đầu tiên nếu có
    return order.items.find((i) => i.sellerId)?.sellerId;
  }, [order.items]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Đơn hàng #{order.id.slice(-8)}
          </h1>
          <p className="text-sm text-slate-600">
            API: <code className="rounded bg-slate-100 px-1">GET /orders/:id</code>
          </p>
        </div>
        <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin đơn hàng */}
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Thông tin đơn hàng</div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Mã đơn hàng:</span>
                <span className="font-medium">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Ngày đặt:</span>
                <span className="font-medium">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString('vi-VN')
                    : 'Chưa có'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Trạng thái:</span>
                <span className="font-medium">{order.status}</span>
              </div>
            </CardContent>
          </Card>

          {/* Danh sách sản phẩm */}
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Sản phẩm ({order.items.length})</div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 px-5 py-4">
                    <div className="h-16 w-20 flex-none rounded-xl bg-slate-100" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{item.productId}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Số lượng: {item.quantity} • Giá: ${item.unitPrice}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Địa chỉ giao hàng */}
          {order.address && (
            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">Địa chỉ giao hàng</div>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-1">
                  {order.address.street && <div>{order.address.street}</div>}
                  <div>
                    {[
                      order.address.ward,
                      order.address.district,
                      order.address.city,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Thông tin vận chuyển */}
          {currentShippingOrder && (
            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">Thông tin vận chuyển</div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">Mã vận đơn:</span>
                  </div>
                  <span className="font-mono font-medium">{currentShippingOrder.trackingNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Trạng thái:</span>
                  <Badge variant={getShippingStatusVariant(currentShippingOrder.status)}>
                    {getShippingStatusLabel(currentShippingOrder.status)}
                  </Badge>
                </div>
                {currentShippingOrder.carrier && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Đơn vị vận chuyển:</span>
                    <span className="font-medium">{currentShippingOrder.carrier}</span>
                  </div>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/shipping/tracking/${currentShippingOrder.trackingNumber}`)}
                >
                  Theo dõi vận chuyển
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tóm tắt thanh toán */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Tóm tắt thanh toán</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Tạm tính</span>
                <span className="font-medium">${subTotal.toFixed(2)}</span>
              </div>
              {order.shippingFee && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Vận chuyển</span>
                  <span className="font-medium">${order.shippingFee.toFixed(2)}</span>
                </div>
              )}
              {order.discountAmount && (
                <div className="flex items-center justify-between text-sm text-emerald-600">
                  <span>Giảm giá</span>
                  <span className="font-medium">-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Tổng</span>
                  <span className="text-lg font-semibold">${total.toFixed(2)}</span>
                </div>
              </div>
              {/* Chat với seller - điều hướng sang trang chat */}
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate('/chat')}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat với seller
              </Button>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowDisputeForm((v) => !v)}
              >
                Khiếu nại / Tranh chấp
              </Button>

              {showDisputeForm && (
                <div className="rounded-xl border bg-white p-3 text-sm">
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Lý do</label>
                      <select
                        value={reasonCode}
                        onChange={(e) => setReasonCode(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#ee4d2d] focus:ring-2 focus:ring-[#ee4d2d]/15"
                      >
                        <option value="DAMAGED_ITEM">Hàng bị hư hỏng</option>
                        <option value="WRONG_ITEM">Giao sai hàng</option>
                        <option value="MISSING_ITEMS">Thiếu hàng</option>
                        <option value="NOT_RECEIVED">Chưa nhận được hàng</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Mô tả (tùy chọn)</label>
                      <Input
                        value={disputeDescription}
                        onChange={(e) => setDisputeDescription(e.target.value)}
                        placeholder="Mô tả chi tiết vấn đề..."
                      />
                    </div>

                    {disputeError && (
                      <div className="text-xs text-red-600">{disputeError}</div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        disabled={disputeCreateStatus === 'loading' || !authUser?.id || !sellerId}
                        onClick={async () => {
                          if (!authUser?.id || !sellerId) return;
                          await dispatch(
                            createDispute({
                              orderId: order.id,
                              userId: authUser.id,
                              sellerId,
                              reasonCode,
                              description: disputeDescription || undefined,
                            }),
                          );
                          // Nếu tạo thành công: đóng form + chuyển sang trang disputes để theo dõi
                          setShowDisputeForm(false);
                          navigate('/disputes');
                        }}
                      >
                        {disputeCreateStatus === 'loading' ? 'Đang gửi…' : 'Gửi khiếu nại'}
                      </Button>
                      <Button variant="secondary" onClick={() => setShowDisputeForm(false)}>
                        Hủy
                      </Button>
                    </div>

                    {!sellerId && (
                      <div className="text-xs text-slate-500">
                        Không xác định được sellerId từ items của đơn hàng (cần `sellerId` trong order items).
                      </div>
                    )}
                  </div>
                </div>
              )}
              {order.status === 'PENDING' && (
                <Button
                  className="w-full"
                  onClick={() => navigate(`/orders/${order.id}/payment`)}
                >
                  Thanh toán ngay
                </Button>
              )}
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate('/orders')}
              >
                Quay lại danh sách
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

function getShippingStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' {
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

function getShippingStatusLabel(status: string): string {
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

