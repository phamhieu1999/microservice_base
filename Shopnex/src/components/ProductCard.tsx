import { Heart, Star } from 'lucide-react';
import type { Product } from '../features/products/productsSlice';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

function formatPriceUSD(v: number) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  } catch {
    return `$${v}`;
  }
}

export function ProductCard({
  product,
  canAddToCart,
  onAddToCart,
}: {
  product: Product;
  canAddToCart: boolean;
  onAddToCart: () => void;
}) {
  const rating = 4.6; // demo UI
  const reviews = 128; // demo UI
  const sold = Math.max(1, Math.round((reviews * rating) / 3)); // demo UI
  const discountPct = product.stock <= 10 ? 15 : 30; // demo UI

  return (
    <div className="group overflow-hidden rounded border bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
      <div className="relative">
        <div className="aspect-square w-full bg-gradient-to-br from-slate-100 to-slate-200" />
        <button
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm hover:bg-white"
          aria-label="Yêu thích"
        >
          <Heart className="h-4 w-4" />
        </button>
        <div className="absolute left-2 top-2 flex gap-2">
          <Badge className="bg-[#ee4d2d]/10 text-[#ee4d2d]">Mall</Badge>
          {product.stock <= 10 && <Badge className="bg-amber-50 text-amber-700">Sắp hết</Badge>}
        </div>

        {/* Tag giảm giá kiểu marketplace */}
        <div className="absolute right-0 top-0 rounded-bl bg-yellow-300 px-2 py-1 text-[11px] font-bold text-slate-900">
          -{discountPct}%
        </div>
      </div>

      <div className="space-y-2 p-3">
        <div className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-slate-900">{product.name}</div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-sm font-semibold text-[#ee4d2d]">{formatPriceUSD(product.price)}</div>
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-medium">{rating}</span>
            <span className="text-slate-400">({reviews})</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-slate-500">{product.category ?? 'Danh mục'}</div>
          <div className="text-xs text-slate-500">Đã bán {sold}</div>
        </div>

        <div className="pt-2">
          <Button
            variant="brand"
            size="sm"
            className="w-full rounded"
            disabled={!canAddToCart}
            onClick={onAddToCart}
            title={canAddToCart ? 'Thêm vào giỏ' : 'Vui lòng đăng nhập'}
          >
            Thêm vào giỏ
          </Button>
        </div>
      </div>
    </div>
  );
}


