import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchHomeFeed } from '../features/home/homeSlice';
import { ProductCard } from '../components/ProductCard';
import { upsertCartItem } from '../features/cart/cartSlice';

export function FlashSalePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthed = useAppSelector((s) => Boolean(s.auth.accessToken));
  const { feed, status } = useAppSelector((s) => s.home);

  useEffect(() => {
    if (!feed) {
      dispatch(fetchHomeFeed());
    }
  }, [dispatch, feed]);

  const flashSaleProducts = feed?.flashSale?.results ?? [];

  const handleAddToCart = (productId: string, price: number) => {
    if (isAuthed) {
      dispatch(upsertCartItem({ productId, quantity: 1, price }));
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Flash Sale</h1>
          <p className="text-sm text-slate-600">
            Các sản phẩm đang trong chương trình Flash Sale hôm nay
          </p>
        </div>
      </div>

      {status === 'loading' && !feed && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="text-sm text-slate-600">Đang tải Flash Sale…</div>
        </div>
      )}

      {flashSaleProducts.length === 0 && status === 'idle' && (
        <div className="text-sm text-slate-600">
          Hiện chưa có sản phẩm Flash Sale nào.
        </div>
      )}

      {flashSaleProducts.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {flashSaleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              canAddToCart={isAuthed}
              onAddToCart={() => handleAddToCart(product.id, product.price)}
            />
          ))}
        </div>
      )}
    </div>
  );
}


