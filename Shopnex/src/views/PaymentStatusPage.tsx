import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPaymentStatus } from '../features/payments/paymentsSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';

export function PaymentStatusPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentPayment, status, error } = useAppSelector((s) => s.payments);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (id) {
      dispatch(getPaymentStatus(id));
    }
  }, [dispatch, id]);

  // Auto refresh nếu payment đang pending/processing
  useEffect(() => {
    if (!autoRefresh || !id) return;
    if (!currentPayment) return;
    if (currentPayment.status !== 'PENDING' && currentPayment.status !== 'PROCESSING') {
      setAutoRefresh(false);
      return;
    }

    const interval = setInterval(() => {
      dispatch(getPaymentStatus(id));
    }, 3000); // Refresh mỗi 3 giây

    return () => clearInterval(interval);
  }, [autoRefresh, id, currentPayment, dispatch]);

  const handleRefresh = () => {
    if (id) {
      dispatch(getPaymentStatus(id));
    }
  };

  if (status === 'loading' && !currentPayment) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-sm text-slate-600">Đang tải thông tin thanh toán…</div>
      </div>
    );
  }

  if (error || !currentPayment) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="text-sm text-red-600">{error || 'Không tìm thấy thông tin thanh toán'}</div>
        <Button variant="secondary" onClick={() => navigate('/orders')}>
          Quay lại danh sách đơn hàng
        </Button>
      </div>
    );
  }

  const payment = currentPayment;
  const isSuccess = payment.status === 'SUCCESS';
  const isFailed = payment.status === 'FAILED' || payment.status === 'CANCELLED';
  const isPending = payment.status === 'PENDING' || payment.status === 'PROCESSING';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trạng thái thanh toán</h1>
          <p className="text-sm text-slate-600">
            API: <code className="rounded bg-slate-100 px-1">GET /payments/:id</code>
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={status === 'loading'}>
          <RefreshCw className={`h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
          <span className="ml-2">Làm mới</span>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                {isSuccess && (
                  <>
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-emerald-600">Thanh toán thành công!</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Đơn hàng của bạn đã được thanh toán thành công.
                      </p>
                    </div>
                  </>
                )}
                {isFailed && (
                  <>
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-red-100">
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-red-600">Thanh toán thất bại</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Thanh toán không thành công. Vui lòng thử lại.
                      </p>
                    </div>
                  </>
                )}
                {isPending && (
                  <>
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-amber-100">
                      <Clock className="h-8 w-8 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-amber-600">Đang xử lý thanh toán</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Vui lòng chờ trong giây lát. Trang sẽ tự động cập nhật.
                      </p>
                    </div>
                  </>
                )}
                <Badge variant={getStatusVariant(payment.status)} className="text-sm">
                  {getStatusLabel(payment.status)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Thông tin thanh toán</div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Mã thanh toán:</span>
                <span className="font-medium font-mono text-xs">{payment.id.slice(-12)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Mã đơn hàng:</span>
                <span className="font-medium">#{payment.orderId.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Số tiền:</span>
                <span className="font-semibold">${payment.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Phương thức:</span>
                <Badge>{getMethodLabel(payment.method)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Nhà cung cấp:</span>
                <Badge variant="secondary">{getProviderLabel(payment.provider)}</Badge>
              </div>
              {payment.transactionId && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Mã giao dịch:</span>
                  <span className="font-mono text-xs">{payment.transactionId}</span>
                </div>
              )}
              {payment.createdAt && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Thời gian:</span>
                  <span className="font-medium">
                    {new Date(payment.createdAt).toLocaleString('vi-VN')}
                  </span>
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
              {isSuccess && (
                <Button
                  className="w-full"
                  onClick={() => navigate(`/orders/${payment.orderId}`)}
                >
                  Xem đơn hàng
                </Button>
              )}
              {isFailed && (
                <Button
                  className="w-full"
                  onClick={() => navigate(`/orders/${payment.orderId}/payment`)}
                >
                  Thử lại thanh toán
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
    case 'SUCCESS':
      return 'success';
    case 'PENDING':
    case 'PROCESSING':
      return 'warning';
    case 'FAILED':
    case 'CANCELLED':
      return 'danger';
    case 'REFUNDED':
      return 'default';
    default:
      return 'default';
  }
}

function getStatusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return 'Chờ xử lý';
    case 'PROCESSING':
      return 'Đang xử lý';
    case 'SUCCESS':
      return 'Thành công';
    case 'FAILED':
      return 'Thất bại';
    case 'CANCELLED':
      return 'Đã hủy';
    case 'REFUNDED':
      return 'Đã hoàn tiền';
    default:
      return status;
  }
}

function getMethodLabel(method: string): string {
  switch (method) {
    case 'CARD':
      return 'Thẻ';
    case 'EWALLET':
      return 'Ví điện tử';
    case 'BANK_TRANSFER':
      return 'Chuyển khoản';
    case 'COD':
      return 'COD';
    default:
      return method;
  }
}

function getProviderLabel(provider: string): string {
  switch (provider) {
    case 'VNPAY':
      return 'VNPay';
    case 'MOMO':
      return 'MoMo';
    case 'STRIPE':
      return 'Stripe';
    case 'MOCK':
      return 'Mock';
    default:
      return provider;
  }
}

