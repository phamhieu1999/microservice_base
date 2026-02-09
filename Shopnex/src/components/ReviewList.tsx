import { Star } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Review } from '../features/reviews/reviewsSlice';

type ReviewListProps = {
  productId: string;
  reviews: Review[];
  status: 'idle' | 'loading' | 'failed';
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  ratingFilter?: number;
  onLoadMore?: (page: number) => void;
};

export function ReviewList({
  reviews,
  status,
  pagination,
  ratingFilter,
  onLoadMore,
}: ReviewListProps) {
  const safeReviews = reviews ?? [];
  
  if (status === 'loading' && safeReviews.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="space-y-2">
                <div className="h-4 w-1/3 rounded bg-slate-100" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-2/3 rounded bg-slate-100" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (safeReviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="text-sm text-slate-600">
            {ratingFilter
              ? `Không có đánh giá ${ratingFilter} sao nào.`
              : 'Chưa có đánh giá nào cho sản phẩm này.'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {safeReviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-5">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">
                    {review.userName || `User ${review.userId.slice(-6)}`}
                  </div>
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
              </div>

              {review.content && (
                <div className="text-sm text-slate-700 whitespace-pre-wrap">{review.content}</div>
              )}

              {review.updatedAt && review.updatedAt !== review.createdAt && (
                <div className="text-xs text-slate-500">Đã chỉnh sửa</div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Pagination */}
      {pagination && pagination.totalPages > pagination.page && onLoadMore && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => onLoadMore(pagination.page + 1)}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Đang tải…' : 'Xem thêm đánh giá'}
          </Button>
        </div>
      )}
    </div>
  );
}

