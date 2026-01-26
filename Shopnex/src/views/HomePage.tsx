import { useEffect } from 'react';
import { ArrowRight, BadgePercent, Flame, Package, Ticket, Shirt, Smartphone, Laptop, Home, Sparkles, Dumbbell } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchHomeFeed } from '../features/home/homeSlice';
import { ProductCard } from '../components/ProductCard';
import { upsertCartItem } from '../features/cart/cartSlice';

export function HomePage() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthed = useAppSelector((s) => Boolean(s.auth.accessToken));
  const { feed, status } = useAppSelector((s) => s.home);

  useEffect(() => {
    dispatch(fetchHomeFeed());
  }, [dispatch]);

  const flashSaleProducts = feed?.flashSale?.results ?? [];
  const topProducts = feed?.topProducts?.data ?? [];
  const recentOrders = feed?.recentOrders ?? [];

  const handleAddToCart = (productId: string, price: number) => {
    if (isAuthed) {
      dispatch(upsertCartItem({ productId, quantity: 1, price }));
    } else {
      nav('/login');
    }
  };

  return (
    <div className="space-y-8">
      {/* Banner kiểu marketplace */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-[#ee4d2d] to-[#ff7337] text-white">
            <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-2 md:items-center">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-semibold">
                  <Flame className="h-4 w-4" />
                  Flash Sale hôm nay
                </div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Deal hot • Giá tốt • Mua nhanh
                </h1>
                <p className="text-sm text-white/90">
                  Trải nghiệm UI theo phong cách marketplace: tìm kiếm nhanh, grid sản phẩm, voucher & ưu đãi.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="secondary" className="border-white/20 bg-white/15 text-white hover:bg-white/20" onClick={() => nav('/products')}>
                    Xem sản phẩm
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  {!isAuthed && (
                    <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => nav('/login')}>
                      Đăng nhập để mua
                    </Button>
                  )}
                </div>
              </div>
              <div className="hidden md:block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-white/15">
                  <img
                    src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=500&fit=crop&q=80"
                    alt="Flash Sale"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#ee4d2d]/20 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <Card className="border-[#ee4d2d]/15">
            <CardContent className="flex items-center gap-3 px-5 py-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ee4d2d]/10 text-[#ee4d2d]">
                <Ticket className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">Voucher mỗi ngày</div>
                <div className="text-sm text-slate-600">Săn voucher giảm giá, freeship.</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#ee4d2d]/15">
            <CardContent className="flex items-center gap-3 px-5 py-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ee4d2d]/10 text-[#ee4d2d]">
                <BadgePercent className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">Ưu đãi chọn lọc</div>
                <div className="text-sm text-slate-600">Deal theo ngành hàng hot.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Flash Sale Products */}
      {flashSaleProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-[#ee4d2d]" />
              <h2 className="text-xl font-semibold tracking-tight">Flash Sale</h2>
            </div>
            <button className="text-sm font-medium text-[#ee4d2d]" onClick={() => nav('/products')}>
              Xem tất cả
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {flashSaleProducts.slice(0, 10).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                canAddToCart={isAuthed}
                onAddToCart={() => handleAddToCart(product.id, product.price)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Top Products */}
      {topProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Sản phẩm bán chạy</h2>
            <button className="text-sm font-medium text-[#ee4d2d]" onClick={() => nav('/products')}>
              Xem tất cả
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {topProducts.slice(0, 10).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                canAddToCart={isAuthed}
                onAddToCart={() => handleAddToCart(product.id, product.price)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent Orders (chỉ hiển thị khi đã đăng nhập) */}
      {isAuthed && recentOrders.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-600" />
              <h2 className="text-xl font-semibold tracking-tight">Đơn hàng gần đây</h2>
            </div>
            <button className="text-sm font-medium text-[#ee4d2d]" onClick={() => nav('/orders')}>
              Xem tất cả
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentOrders.slice(0, 6).map((order) => (
              <Card key={order.id} className="hover:shadow-md transition">
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Đơn hàng #{order.id.slice(-8)}</div>
                      <div className="text-xs text-slate-600">{order.status}</div>
                    </div>
                    <div className="text-sm text-slate-700">
                      {order.items.length} sản phẩm
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm font-semibold text-[#ee4d2d]">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => nav(`/orders/${order.id}`)}
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Quick categories kiểu Shopee (demo UI) */}
      <section className="rounded-2xl border bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="text-sm font-semibold text-slate-900">Danh mục nổi bật</div>
          <button className="text-sm font-medium text-[#ee4d2d]" onClick={() => nav('/products')}>Xem tất cả</button>
        </div>
        <div className="grid grid-cols-3 gap-3 p-5 sm:grid-cols-4 md:grid-cols-6">
          {[
            { name: 'Thời trang', icon: Shirt, color: 'text-pink-500' },
            { name: 'Điện thoại', icon: Smartphone, color: 'text-blue-500' },
            { name: 'Điện tử', icon: Laptop, color: 'text-purple-500' },
            { name: 'Nhà cửa', icon: Home, color: 'text-amber-500' },
            { name: 'Sắc đẹp', icon: Sparkles, color: 'text-rose-500' },
            { name: 'Thể thao', icon: Dumbbell, color: 'text-green-500' },
          ].map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.name}
                onClick={() => nav('/products')}
                className="group rounded-xl border bg-white px-3 py-3 text-left hover:border-[#ee4d2d]/40 hover:shadow-sm transition"
              >
                <div className={`mb-2 grid h-10 w-10 place-items-center rounded-xl bg-slate-50 group-hover:bg-[#ee4d2d]/10 transition ${category.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="text-xs font-semibold">{category.name}</div>
                <div className="text-[11px] text-slate-500">Xem ngay</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Loading state */}
      {status === 'loading' && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="text-sm text-slate-600">Đang tải dữ liệu trang chủ…</div>
        </div>
      )}
    </div>
  );
}


