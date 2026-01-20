import { useEffect } from 'react';
import { fetchProducts, setQuery } from '../features/products/productsSlice';
import { upsertCartItem } from '../features/cart/cartSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

export function ProductsPage() {
  const dispatch = useAppDispatch();
  const { items, status, error, q } = useAppSelector((s) => s.products);
  const isAuthed = useAppSelector((s) => Boolean(s.auth.accessToken));

  // Đảm bảo luôn là mảng để tránh lỗi items.map is not a function
  const list = Array.isArray(items) ? items : [];

  useEffect(() => {
    dispatch(fetchProducts(q));
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* Top bar kiểu marketplace */}
      <section className="rounded-2xl border bg-white">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#ee4d2d]/10 text-[#ee4d2d]">Gợi ý hôm nay</Badge>
            <div className="text-sm text-slate-600">
              {status === 'loading' ? 'Đang tải…' : `Hiển thị ${list.length} sản phẩm`}
            </div>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <Input
              value={q}
              onChange={(e) => dispatch(setQuery(e.target.value))}
              placeholder="Tìm kiếm theo tên / từ khoá…"
              className="w-full sm:w-72"
            />
            <Button variant="brand" onClick={() => dispatch(fetchProducts(q))}>
              Tìm
            </Button>
            <Button variant="secondary" onClick={() => dispatch(setQuery(''))}>
              Xoá
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t px-4 py-3 text-sm">
          {['Flash Sale', 'Mall', 'Freeship', 'Giá tốt', 'Bán chạy'].map((t) => (
            <button
              key={t}
              className="rounded-full border px-3 py-1 text-xs font-medium text-slate-700 hover:border-[#ee4d2d]/40 hover:text-[#ee4d2d]"
              onClick={() => dispatch(fetchProducts(q))}
            >
              {t}
            </button>
          ))}
          <span className="ml-auto hidden text-xs text-slate-400 md:inline">
            API: <code className="rounded bg-slate-100 px-1">GET /products?q=...</code>
          </span>
        </div>
      </section>

      {error && <div className="rounded-2xl border bg-white px-5 py-4 text-sm text-red-600">{error}</div>}

      {/* Grid */}
      <section className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {status === 'loading' && list.length === 0
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="overflow-hidden rounded border bg-white shadow-sm">
                <div className="aspect-square bg-slate-100" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-2/3 rounded bg-slate-100" />
                  <div className="h-4 w-full rounded bg-slate-100" />
                  <div className="h-4 w-5/6 rounded bg-slate-100" />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="h-4 w-20 rounded bg-slate-100" />
                    <div className="h-9 w-24 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))
          : list.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                canAddToCart={isAuthed}
                onAddToCart={() => dispatch(upsertCartItem({ productId: p.id, quantity: 1, price: p.price }))}
              />
            ))}
      </section>

      {status !== 'loading' && list.length === 0 && (
        <div className="rounded-2xl border bg-white px-5 py-10 text-center text-sm text-slate-600">
          Không có sản phẩm phù hợp. Thử từ khoá khác nhé.
        </div>
      )}
    </div>
  );
}


