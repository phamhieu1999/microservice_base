import { useState } from 'react';
import { createReview, updateReview, type Review } from '../features/reviews/reviewsSlice';
import { useAppDispatch } from '../store/hooks';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Star, X } from 'lucide-react';

type ReviewFormProps = {
  productId: string;
  review?: Review; // Nếu có review thì là edit mode
  onSuccess?: (review?: Review) => void;
  onCancel?: () => void;
};

export function ReviewForm({ productId, review, onSuccess, onCancel }: ReviewFormProps) {
  const dispatch = useAppDispatch();
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState(review?.content ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      let result: Review;
      if (review) {
        // Update review
        result = await dispatch(
          updateReview({
            reviewId: review.id,
            payload: { rating, content: content || undefined },
          }),
        ).unwrap();
      } else {
        // Create review
        result = await dispatch(
          createReview({
            productId,
            rating,
            content: content || undefined,
          }),
        ).unwrap();
      }
      onSuccess?.(result);
    } catch (error) {
      // Error handled by Redux
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                {review ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá của bạn'}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Chia sẻ trải nghiệm của bạn về sản phẩm này
              </div>
            </div>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Rating Stars */}
          <div>
            <label className="mb-2 block text-sm font-medium">Đánh giá</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="text-2xl transition hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-200 text-slate-200'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-slate-600">
                  {rating === 1 && 'Rất tệ'}
                  {rating === 2 && 'Tệ'}
                  {rating === 3 && 'Bình thường'}
                  {rating === 4 && 'Tốt'}
                  {rating === 5 && 'Rất tốt'}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="mb-2 block text-sm font-medium">Nội dung đánh giá (tùy chọn)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Chia sẻ chi tiết về sản phẩm..."
              rows={4}
              className="h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#ee4d2d] focus:ring-2 focus:ring-[#ee4d2d]/15 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button type="submit" disabled={rating === 0 || isSubmitting} className="flex-1">
              {isSubmitting ? 'Đang gửi…' : review ? 'Cập nhật' : 'Gửi đánh giá'}
            </Button>
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                Hủy
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

