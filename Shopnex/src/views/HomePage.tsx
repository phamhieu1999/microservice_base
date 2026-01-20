import { ArrowRight, BadgePercent, Flame, Ticket, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const nav = useNavigate();

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
                  <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => nav('/login')}>
                    Đăng nhập để mua
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="aspect-[16/10] rounded-2xl bg-white/15" />
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

      {/* Quick categories kiểu Shopee (demo UI) */}
      <section className="rounded-2xl border bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="text-sm font-semibold text-slate-900">Danh mục nổi bật</div>
          <button className="text-sm font-medium text-[#ee4d2d]" onClick={() => nav('/products')}>Xem tất cả</button>
        </div>
        <div className="grid grid-cols-3 gap-3 p-5 sm:grid-cols-4 md:grid-cols-6">
          {['Thời trang', 'Điện thoại', 'Điện tử', 'Nhà cửa', 'Sắc đẹp', 'Thể thao'].map((c) => (
            <button
              key={c}
              onClick={() => nav('/products')}
              className="group rounded-xl border bg-white px-3 py-3 text-left hover:border-[#ee4d2d]/40 hover:shadow-sm"
            >
              <div className="mb-2 h-10 w-10 rounded-xl bg-slate-100 group-hover:bg-[#ee4d2d]/10" />
              <div className="text-xs font-semibold">{c}</div>
              <div className="text-[11px] text-slate-500">Xem ngay</div>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}


