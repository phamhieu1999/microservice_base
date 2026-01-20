import { useEffect } from 'react';
import { fetchCart, removeCartItem } from '../features/cart/cartSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function CartPage() {
  const dispatch = useAppDispatch();
  const { cart, status, error } = useAppSelector((s) => s.cart);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const items = cart?.items ?? [];
  const totalQty = items.reduce((sum, it) => sum + (it.quantity ?? 0), 0);
  const subTotal = items.reduce((sum, it) => sum + (it.price ?? 0) * (it.quantity ?? 0), 0);
  const shipping = totalQty > 0 ? 0 : 0;
  const total = subTotal + shipping;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Giỏ hàng</h1>
          <p className="text-sm text-slate-600">
            API: <code className="rounded bg-slate-100 px-1">GET /cart</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{totalQty} sản phẩm</Badge>
          <Button variant="secondary" onClick={() => dispatch(fetchCart())}>
            Làm mới
          </Button>
        </div>
      </div>

      {status === 'loading' && <div className="text-sm text-slate-600">Đang tải…</div>}
      {error && <div className="rounded-2xl border bg-white px-5 py-4 text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Sản phẩm trong giỏ</div>
            </CardHeader>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-600">Chưa có sản phẩm trong giỏ.</div>
              ) : (
                <div className="divide-y">
                  {items.map((it) => (
                    <div key={it.productId} className="flex items-center gap-4 px-5 py-4">
                      <div className="h-16 w-20 flex-none rounded-xl bg-slate-100" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{it.productId}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          Số lượng: {it.quantity} • Giá: ${it.price}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="danger" size="sm" onClick={() => dispatch(removeCartItem(it.productId))}>
                          Xoá
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Tóm tắt đơn hàng</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Tạm tính</span>
                <span className="font-medium">${subTotal}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Vận chuyển</span>
                <span className="font-medium">${shipping}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Tổng</span>
                  <span className="text-lg font-semibold">${total}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  * Tạm tính được tính theo (price * quantity) từ cart-service.
                </p>
              </div>
              <Button disabled={items.length === 0} className="w-full">
                Thanh toán
              </Button>
              <Button variant="secondary" className="w-full">
                Tiếp tục mua sắm
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


