import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { getPoints, getHistory, redeemPoints, clearLoyalty } from '../features/loyalty/loyaltySlice';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Gift, History, TrendingUp, Award } from 'lucide-react';

export function LoyaltyPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthed = useAppSelector((s) => Boolean(s.auth.accessToken));
  const { userPoints, history, status, historyStatus, redeemStatus, error } = useAppSelector(
    (s) => s.loyalty,
  );

  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isAuthed) {
      navigate('/login');
      return;
    }

    dispatch(clearLoyalty());
    dispatch(getPoints());
    dispatch(getHistory({ limit: 50 }));
  }, [dispatch, isAuthed, navigate]);

  // Refresh points and history after successful redeem
  useEffect(() => {
    if (redeemStatus === 'success') {
      dispatch(getPoints());
      dispatch(getHistory({ limit: 50 }));
    }
  }, [redeemStatus, dispatch]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();

    const points = parseInt(pointsToRedeem, 10);
    if (isNaN(points) || points <= 0) {
      alert('Vui lòng nhập số điểm hợp lệ');
      return;
    }

    if (userPoints && points > userPoints.balance) {
      alert('Số điểm không đủ');
      return;
    }

    await dispatch(redeemPoints({ points, description: description || undefined }));
    
    // Clear form after submit (refresh will happen via useEffect)
    setPointsToRedeem('');
    setDescription('');
  };

  const getTierBadgeVariant = (tier?: string) => {
    if (!tier) return 'default';
    const tierLower = tier.toLowerCase();
    if (tierLower.includes('gold') || tierLower.includes('vip')) return 'warning';
    if (tierLower.includes('silver')) return 'secondary';
    return 'default';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (!isAuthed) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Điểm tích lũy</h1>
        <p className="text-sm text-slate-600">Xem điểm tích lũy và lịch sử giao dịch của bạn</p>
      </div>

      {error && (
        <div className="rounded-2xl border bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>
      )}

      {/* Points Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-[#ee4d2d]/15">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-[#ee4d2d]" />
                <div className="text-sm font-semibold">Điểm tích lũy hiện tại</div>
              </div>
              {userPoints?.tier && (
                <Badge variant={getTierBadgeVariant(userPoints.tier)}>{userPoints.tier}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {status === 'loading' ? (
              <div className="text-sm text-slate-600">Đang tải...</div>
            ) : userPoints ? (
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold text-[#ee4d2d]">
                    {userPoints.balance.toLocaleString('vi-VN')}
                  </div>
                  <div className="text-sm text-slate-600">điểm</div>
                </div>
                {userPoints.totalPoints !== undefined && (
                  <div className="text-sm text-slate-600">
                    Tổng điểm đã tích lũy: {userPoints.totalPoints.toLocaleString('vi-VN')} điểm
                  </div>
                )}
                {userPoints.lifetimePoints !== undefined && (
                  <div className="text-sm text-slate-600">
                    Điểm tích lũy trọn đời: {userPoints.lifetimePoints.toLocaleString('vi-VN')} điểm
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-600">Không có dữ liệu</div>
            )}
          </CardContent>
        </Card>

        {/* Redeem Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#ee4d2d]" />
              <div className="text-sm font-semibold">Đổi điểm tích lũy</div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRedeem} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Số điểm muốn đổi</label>
                <Input
                  type="number"
                  min="1"
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(e.target.value)}
                  placeholder="Nhập số điểm"
                  disabled={redeemStatus === 'loading'}
                />
                {userPoints && (
                  <div className="mt-1 text-xs text-slate-500">
                    Số điểm khả dụng: {userPoints.balance.toLocaleString('vi-VN')} điểm
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Mô tả (tùy chọn)</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Đổi điểm lấy voucher giảm giá"
                  disabled={redeemStatus === 'loading'}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={redeemStatus === 'loading' || !pointsToRedeem}
              >
                {redeemStatus === 'loading' ? 'Đang xử lý...' : 'Đổi điểm'}
              </Button>
              {redeemStatus === 'success' && (
                <div className="text-sm text-green-600">Đổi điểm thành công!</div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-600" />
            <div className="text-sm font-semibold">Lịch sử giao dịch điểm</div>
          </div>
        </CardHeader>
        <CardContent>
          {historyStatus === 'loading' ? (
            <div className="py-8 text-center text-sm text-slate-600">Đang tải lịch sử...</div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-600">Chưa có giao dịch nào</div>
          ) : (
            <div className="space-y-3">
              {history.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border bg-white p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {transaction.points > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <Gift className="h-4 w-4 text-orange-600" />
                      )}
                      <div>
                        <div className="text-sm font-semibold">
                          {transaction.points > 0 ? 'Tích lũy' : 'Đổi điểm'}
                        </div>
                        <div className="text-xs text-slate-600">
                          {transaction.source || transaction.type || 'Giao dịch'}
                          {transaction.referenceId && ` • ${transaction.referenceId.slice(-8)}`}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDate(transaction.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-semibold ${
                        transaction.points > 0 ? 'text-green-600' : 'text-orange-600'
                      }`}
                    >
                      {transaction.points > 0 ? '+' : ''}
                      {transaction.points.toLocaleString('vi-VN')} điểm
                    </div>
                    <div className="text-xs text-slate-500">
                      Còn lại: {transaction.balanceAfter.toLocaleString('vi-VN')} điểm
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

