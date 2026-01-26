import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { deleteReview } from '../features/reviews/reviewsSlice';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Star, Edit, Trash2 } from 'lucide-react';
import { ReviewForm } from '../components/ReviewForm';
import type { Review } from '../features/reviews/reviewsSlice';

export function UserReviewsPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { accessToken, user } = useAppSelector((s) => s.auth);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    if (!accessToken || !user?.id) {
      navigate('/login');
      return;
    }

    // TODO: Fetch user reviews from API
    // dispatch(getReviewsByUser(user.id));
    // Tạm thời dùng empty array
    setReviews([]);
  }, [accessToken, user, navigate]);

  const handleDeleteReview = async (reviewId: string) => {
    if (confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      await dispatch(deleteReview(reviewId));
      setReviews(reviews.filter((r) => r.id !== reviewId));
    }
  };

  const userReviews = reviews;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Đánh giá của tôi</h1>
        <p className="text-sm text-slate-600">Quản lý các đánh giá bạn đã viết</p>
      </div>

      {userReviews.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <div className="text-sm text-slate-600">Bạn chưa có đánh giá nào.</div>
            <Button variant="secondary" className="mt-4" onClick={() => navigate('/products')}>
              Xem sản phẩm
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {userReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-semibold">Sản phẩm: {review.productId}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-slate-200 text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        {review.createdAt && (
                          <span className="text-xs text-slate-500">
                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingReview(review)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteReview(review.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {review.content && (
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">{review.content}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Review Form */}
      {editingReview && (
        <ReviewForm
          productId={editingReview.productId}
          review={editingReview}
          onSuccess={() => {
            setEditingReview(null);
            // TODO: Refresh reviews
          }}
          onCancel={() => setEditingReview(null)}
        />
      )}
    </div>
  );
}

