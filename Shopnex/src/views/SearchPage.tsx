import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchProducts, clearResults, setQuery } from '../features/search/searchSlice';
import { upsertCartItem } from '../features/cart/cartSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Search, X } from 'lucide-react';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { results, query, total, status, error } = useAppSelector((s) => s.search);
  const isAuthed = useAppSelector((s) => Boolean(s.auth.accessToken));
  const [localQuery, setLocalQuery] = useState(searchParams.get('q') || '');

  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    if (searchQuery) {
      dispatch(setQuery(searchQuery));
      dispatch(searchProducts({ query: searchQuery, limit: 20 }));
    } else {
      dispatch(clearResults());
    }
  }, [dispatch, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setSearchParams({ q: localQuery.trim() });
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    setSearchParams({});
    dispatch(clearResults());
  };

  const handleAddToCart = (productId: string, price: number) => {
    if (isAuthed) {
      dispatch(upsertCartItem({ productId, quantity: 1, price }));
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Tìm kiếm sản phẩm</h1>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#ee4d2d] focus:ring-2 focus:ring-[#ee4d2d]/15"
            />
            {localQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" variant="brand" className="h-11 px-6">
            Tìm kiếm
          </Button>
        </form>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {status === 'loading' ? 'Đang tìm kiếm…' : `Tìm thấy ${total} kết quả`}
            </Badge>
            {searchQuery && (
              <span className="text-sm text-slate-600">
                cho từ khóa: <span className="font-semibold">"{searchQuery}"</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <>
          {status === 'loading' ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-sm text-slate-600">Đang tìm kiếm…</div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
              <div className="text-sm text-slate-600">Không tìm thấy sản phẩm nào</div>
              <Button variant="secondary" onClick={() => navigate('/products')}>
                Xem tất cả sản phẩm
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {results.map((result) => (
                <ProductCard
                  key={result.productId}
                  product={{
                    id: result.productId,
                    name: result.name,
                    description: result.description,
                    price: result.price,
                    stock: result.stock,
                    category: result.category,
                    brand: result.brand,
                    sellerId: result.sellerId,
                  }}
                  canAddToCart={isAuthed}
                  onAddToCart={() => handleAddToCart(result.productId, result.price)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty State - No Search Query */}
      {!searchQuery && (
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
          <Search className="h-12 w-12 text-slate-300" />
          <div className="text-sm text-slate-600">Nhập từ khóa để tìm kiếm sản phẩm</div>
          <Button variant="secondary" onClick={() => navigate('/products')}>
            Xem tất cả sản phẩm
          </Button>
        </div>
      )}
    </div>
  );
}

