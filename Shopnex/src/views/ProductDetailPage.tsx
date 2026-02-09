import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../features/products/productsSlice';
import { getReviewsByProduct, getReviewStats, clearReviews } from '../features/reviews/reviewsSlice';
import { upsertCartItem } from '../features/cart/cartSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Star, ShoppingCart } from 'lucide-react';
import { ReviewForm } from '../components/ReviewForm';
import { ReviewList } from '../components/ReviewList';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthed = useAppSelector((s) => Boolean(s.auth.accessToken));
  const { currentProduct, status: productStatus } = useAppSelector((s) => s.products);
  const { reviews, stats, pagination, status } = useAppSelector((s) => s.reviews);

  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(getProductById(id));
      dispatch(clearReviews());
      dispatch(getReviewStats(id));
      dispatch(getReviewsByProduct({ productId: id, page: 1, limit: 10 }));
    }
  }, [dispatch, id]);

  const handleAddToCart = () => {
    if (currentProduct && isAuthed) {
      dispatch(upsertCartItem({ productId: currentProduct.id, quantity: 1, price: currentProduct.price }));
    } else {
      navigate('/login');
    }
  };

  if (productStatus === 'loading' || !currentProduct) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-sm text-slate-600">Đang tải sản phẩm…</div>
      </div>
    );
  }

  const product = currentProduct;

  return (
    <div className="space-y-8">
      {/* Product Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="aspect-square rounded-2xl border bg-slate-100" />

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
            <p className="mt-2 text-sm text-slate-600">{product.description}</p>
          </div>

          {/* Rating Summary */}
          {stats && stats.average != null && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-lg font-semibold">{stats.average.toFixed(1)}</span>
              </div>
              <div className="text-sm text-slate-600">
                ({stats.total ?? 0} {stats.total === 1 ? 'đánh giá' : 'đánh giá'})
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="text-2xl font-semibold">
              ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
            </div>
            {(product.stock ?? 0) > 0 ? (
              <Badge variant="success">Còn hàng</Badge>
            ) : (
              <Badge variant="danger">Hết hàng</Badge>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={handleAddToCart}
              disabled={!isAuthed || (product.stock ?? 0) === 0}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Thêm vào giỏ hàng
            </Button>
            {!isAuthed && (
              <Button variant="secondary" onClick={() => navigate('/login')}>
                Đăng nhập để mua
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Đánh giá sản phẩm</h2>
          {isAuthed && (
            <Button variant="secondary" size="sm" onClick={() => setShowReviewForm(!showReviewForm)}>
              {showReviewForm ? 'Ẩn form' : 'Viết đánh giá'}
            </Button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && isAuthed && (
          <ReviewForm
            productId={product.id}
            onSuccess={(newReview) => {
              setShowReviewForm(false);
              if (id) {
                // Clear filter to show all reviews (including the new one)
                setRatingFilter(undefined);
                // Refresh stats - review đã được thêm vào danh sách tự động bởi Redux
                dispatch(getReviewStats(id));
                // Refresh reviews list để đảm bảo có đầy đủ data từ server
                // Sort mới nhất trước để review mới hiện ở đầu
                dispatch(getReviewsByProduct({ productId: id, page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }));
              }
            }}
            onCancel={() => setShowReviewForm(false)}
          />
        )}

        {/* Review Stats */}
        {stats && stats.distribution && stats.distribution.length > 0 && (
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Phân bố đánh giá</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const dist = stats.distribution.find((d) => d.rating === rating);
                  const count = dist?.count ?? 0;
                  const percentage = dist?.percentage ?? 0;

                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setRatingFilter(ratingFilter === rating ? undefined : rating)}
                      className={`flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm transition ${
                        ratingFilter === rating
                          ? 'bg-[#ee4d2d]/10 border border-[#ee4d2d]/20'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1 w-16">
                        <span className="font-medium">{rating}</span>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 w-full rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full bg-amber-400"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-right text-xs text-slate-600">{count}</div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review List */}
        <ReviewList
          productId={product.id}
          reviews={reviews}
          status={status}
          pagination={pagination}
          ratingFilter={ratingFilter}
          onLoadMore={(page) => {
            if (id) {
              dispatch(
                getReviewsByProduct({
                  productId: id,
                  page,
                  limit: 10,
                  rating: ratingFilter,
                }),
              );
            }
          }}
        />
      </div>
    </div>
  );
}

