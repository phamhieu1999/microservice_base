import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, clearCurrentOrder } from '../features/orders/ordersSlice';
import { fetchCart } from '../features/cart/cartSlice';
import type { CartItem } from '../features/cart/cartSlice';
import { calculateShipping, getShippingMethods, clearQuote } from '../features/shipping/shippingSlice';
import { validateVoucher, clearVoucher } from '../features/vouchers/vouchersSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';

export function CheckoutPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { cart, status: cartStatus } = useAppSelector((s) => s.cart);
  const { createStatus, error, currentOrder } = useAppSelector((s) => s.orders);
  const { currentQuote, quoteStatus } = useAppSelector((s) => s.shipping);
  const { currentVoucher, status: voucherStatus, error: voucherError } = useAppSelector((s) => s.vouchers);

  const [address, setAddress] = useState({
    street: '',
    city: '',
    district: '',
    ward: '',
  });
  const [voucherCode, setVoucherCode] = useState('');
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCart());
    dispatch(clearCurrentOrder());
    dispatch(clearVoucher());
    dispatch(clearQuote());
    dispatch(getShippingMethods());
  }, [dispatch]);

  // Tính phí vận chuyển khi có địa chỉ và items
  useEffect(() => {
    const items = cart?.items ?? [];
    if (items.length === 0) return;

    const hasAddress = address.street || address.city || address.district || address.ward;
    if (!hasAddress) return;

    const addressString = [
      address.street,
      address.ward,
      address.district,
      address.city,
    ]
      .filter(Boolean)
      .join(', ');

    const quoteItems = items.map((item: CartItem) => ({
      productId: item.productId,
      price: item.price,
      quantity: item.quantity,
      weight: 1, // Default weight, có thể lấy từ product sau
    }));

    dispatch(calculateShipping({ address: addressString, items: quoteItems }));
  }, [dispatch, cart, address]);

  useEffect(() => {
    // Nếu tạo đơn hàng thành công, chuyển đến trang thanh toán
    if (createStatus === 'success' && currentOrder) {
      navigate(`/orders/${currentOrder.id}/payment`);
    }
  }, [createStatus, currentOrder, navigate]);

  const items = cart?.items ?? [];
  const subTotal = items.reduce((sum, it) => sum + (it.price ?? 0) * (it.quantity ?? 0), 0);
  const discountAmount = currentVoucher?.discountAmount ?? 0;
  
  // Lấy shipping fee từ quote đã chọn hoặc quote đầu tiên
  const selectedQuote = selectedShippingMethod
    ? currentQuote?.quotes.find((q) => q.methodId === selectedShippingMethod)
    : currentQuote?.quotes[0];
  const shippingFee = selectedQuote?.totalFee ?? 0;
  const total = subTotal + shippingFee - discountAmount;

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim() || items.length === 0) return;
    const validationItems = items.map((item: CartItem) => ({
      productId: item.productId,
      price: item.price,
      quantity: item.quantity,
    }));
    await dispatch(
      validateVoucher({
        code: voucherCode.trim(),
        items: validationItems,
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      return;
    }

    // Chuyển đổi cart items sang order items
    const orderItems = items.map((item: CartItem) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.price,
    }));

    await dispatch(
      createOrder({
        items: orderItems,
        voucherCode: voucherCode || undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        shippingFee: shippingFee > 0 ? shippingFee : undefined,
        address: Object.values(address).some((v) => v) ? address : undefined,
      }),
    );
  };

  if (cartStatus === 'loading') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-sm text-slate-600">Đang tải giỏ hàng…</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="text-sm text-slate-600">Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.</div>
        <Button variant="secondary" onClick={() => navigate('/products')}>
          Xem sản phẩm
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Thanh toán</h1>
        <p className="text-sm text-slate-600">
          API: <code className="rounded bg-slate-100 px-1">POST /orders</code>
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Địa chỉ giao hàng */}
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Địa chỉ giao hàng</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Đường/Phố</label>
                <Input
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder="123 Đường ABC"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Thành phố</label>
                  <Input
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="Hà Nội"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Quận/Huyện</label>
                  <Input
                    value={address.district}
                    onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    placeholder="Quận 1"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phường/Xã</label>
                <Input
                  value={address.ward}
                  onChange={(e) => setAddress({ ...address, ward: e.target.value })}
                  placeholder="Phường 1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Phương thức vận chuyển */}
          {currentQuote && currentQuote.quotes.length > 0 && (
            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">Phương thức vận chuyển</div>
              </CardHeader>
              <CardContent className="space-y-2">
                {quoteStatus === 'loading' && (
                  <div className="text-sm text-slate-600">Đang tính phí vận chuyển…</div>
                )}
                {currentQuote.quotes.map((quote) => (
                  <button
                    key={quote.methodId}
                    type="button"
                    onClick={() => setSelectedShippingMethod(quote.methodId)}
                    className={`w-full rounded-xl border-2 p-3 text-left transition ${
                      selectedShippingMethod === quote.methodId
                        ? 'border-[#ee4d2d] bg-[#ee4d2d]/5'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">{quote.methodName}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          Dự kiến: {quote.estimatedDays} ngày
                        </div>
                      </div>
                      <div className="text-sm font-semibold">${quote.totalFee.toFixed(2)}</div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Mã giảm giá */}
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Mã giảm giá</div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Nhập mã giảm giá"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!voucherCode.trim() || voucherStatus === 'loading' || items.length === 0}
                  onClick={handleApplyVoucher}
                >
                  {voucherStatus === 'loading' ? 'Đang kiểm tra…' : 'Áp dụng'}
                </Button>
              </div>
              {voucherError && (
                <div className="text-xs text-red-600">{voucherError}</div>
              )}
              {currentVoucher && !voucherError && (
                <div className="text-xs text-emerald-700">
                  Áp dụng mã thành công! Giảm{' '}
                  <span className="font-semibold">
                    {currentVoucher.discountAmount.toLocaleString('vi-VN')}₫
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danh sách sản phẩm */}
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Sản phẩm</div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-4 px-5 py-4">
                    <div className="h-16 w-20 flex-none rounded-xl bg-slate-100" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{item.productId}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Số lượng: {item.quantity} • Giá: ${item.price}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Tóm tắt đơn hàng</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Tạm tính</span>
                <span className="font-medium">${subTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Vận chuyển</span>
                <span className="font-medium">${shippingFee.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-sm text-emerald-600">
                  <span>Giảm giá</span>
                  <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Tổng</span>
                  <span className="text-lg font-semibold">${total.toFixed(2)}</span>
                </div>
              </div>
              <Button
                type="submit"
                disabled={createStatus === 'loading' || items.length === 0}
                className="w-full"
              >
                {createStatus === 'loading' ? 'Đang tạo đơn hàng…' : 'Đặt hàng'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => navigate('/cart')}
              >
                Quay lại giỏ hàng
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

