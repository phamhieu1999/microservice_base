import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPayment, clearCurrentPayment } from '../features/payments/paymentsSlice';
import { getOrder } from '../features/orders/ordersSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { PaymentMethod, PaymentProvider } from '../features/payments/paymentsSlice';

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentOrder, status: orderStatus } = useAppSelector((s) => s.orders);
  const { createStatus, error, currentPayment } = useAppSelector((s) => s.payments);

  const [method, setMethod] = useState<PaymentMethod>('CARD');
  const [provider, setProvider] = useState<PaymentProvider>('MOCK');

  useEffect(() => {
    dispatch(clearCurrentPayment());
    if (orderId) {
      dispatch(getOrder(orderId));
    }
  }, [dispatch, orderId]);

  useEffect(() => {
    // Nếu tạo payment thành công và có paymentUrl, redirect đến payment gateway
    if (createStatus === 'success' && currentPayment?.paymentUrl) {
      window.location.href = currentPayment.paymentUrl;
      return;
    }
    // Nếu tạo payment thành công nhưng không có paymentUrl (COD hoặc MOCK), chuyển đến trang status
    if (createStatus === 'success' && currentPayment) {
      navigate(`/payments/${currentPayment.id}`);
    }
  }, [createStatus, currentPayment, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId || !currentOrder) {
      return;
    }

    const amount = currentOrder.totalAmount || 0;
    const idempotencyKey = `order-${orderId}-${Date.now()}`;

    await dispatch(
      createPayment({
        orderId,
        amount,
        method,
        provider,
        idempotencyKey,
        description: `Thanh toán đơn hàng #${orderId.slice(-8)}`,
      }),
    );
  };

  if (orderStatus === 'loading') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-sm text-slate-600">Đang tải thông tin đơn hàng…</div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="text-sm text-red-600">Không tìm thấy đơn hàng</div>
        <Button variant="secondary" onClick={() => navigate('/orders')}>
          Quay lại danh sách đơn hàng
        </Button>
      </div>
    );
  }

  const amount = currentOrder.totalAmount || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Thanh toán đơn hàng</h1>
        <p className="text-sm text-slate-600">
          API: <code className="rounded bg-slate-100 px-1">POST /payments</code>
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>
      )}

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
                <span className="font-medium">#{orderId?.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Số lượng sản phẩm:</span>
                <span className="font-medium">{currentOrder.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tổng tiền:</span>
                <span className="font-semibold text-lg">${amount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Chọn phương thức thanh toán */}
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Phương thức thanh toán</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Payment Method */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Phương thức</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(['CARD', 'EWALLET', 'BANK_TRANSFER', 'COD'] as PaymentMethod[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={`rounded-xl border-2 p-3 text-left text-sm font-medium transition ${
                          method === m
                            ? 'border-[#ee4d2d] bg-[#ee4d2d]/5 text-[#ee4d2d]'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {getMethodLabel(m)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Provider */}
                {method !== 'COD' && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">Nhà cung cấp</label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(['VNPAY', 'MOMO', 'STRIPE', 'MOCK'] as PaymentProvider[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setProvider(p)}
                          className={`rounded-xl border-2 p-3 text-left text-sm font-medium transition ${
                            provider === p
                              ? 'border-[#ee4d2d] bg-[#ee4d2d]/5 text-[#ee4d2d]'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {getProviderLabel(p)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {method === 'COD' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <div className="font-semibold">Thanh toán khi nhận hàng (COD)</div>
                    <div className="mt-1 text-xs">
                      Bạn sẽ thanh toán khi nhận được sản phẩm. Không cần chọn nhà cung cấp.
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={createStatus === 'loading'}
                  className="w-full"
                >
                  {createStatus === 'loading'
                    ? 'Đang xử lý…'
                    : method === 'COD'
                      ? 'Xác nhận đặt hàng'
                      : 'Thanh toán'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tóm tắt */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Tóm tắt thanh toán</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Số tiền</span>
                <span className="text-lg font-semibold">${amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Phương thức</span>
                <Badge>{getMethodLabel(method)}</Badge>
              </div>
              {method !== 'COD' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Nhà cung cấp</span>
                  <Badge variant="secondary">{getProviderLabel(provider)}</Badge>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="text-xs text-slate-500">
                  {method === 'COD'
                    ? 'Bạn sẽ thanh toán khi nhận hàng'
                    : 'Bạn sẽ được chuyển đến trang thanh toán của nhà cung cấp'}
                </div>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate(`/orders/${orderId}`)}
              >
                Quay lại đơn hàng
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'CARD':
      return '💳 Thẻ tín dụng/Ghi nợ';
    case 'EWALLET':
      return '📱 Ví điện tử';
    case 'BANK_TRANSFER':
      return '🏦 Chuyển khoản ngân hàng';
    case 'COD':
      return '📦 Thanh toán khi nhận hàng';
    default:
      return method;
  }
}

function getProviderLabel(provider: PaymentProvider): string {
  switch (provider) {
    case 'VNPAY':
      return 'VNPay';
    case 'MOMO':
      return 'MoMo';
    case 'STRIPE':
      return 'Stripe';
    case 'MOCK':
      return 'Mock (Test)';
    default:
      return provider;
  }
}

