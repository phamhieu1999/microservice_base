import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  getTotalRevenue,
  getRevenueByPeriod,
  getTopProducts,
  clearAnalytics,
} from '../features/analytics/analyticsSlice';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { TrendingUp, DollarSign, ShoppingCart, Package, BarChart3 } from 'lucide-react';

export function AnalyticsDashboardPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthed = useAppSelector((s) => Boolean(s.auth.accessToken));

  // Date range state - default to last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(
    thirtyDaysAgo.toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const { totalRevenue, revenueByPeriod, topProducts, status, revenueStatus, topProductsStatus, error } =
    useAppSelector((s) => s.analytics);

  const loadAnalytics = useCallback(() => {
    if (startDate && endDate) {
      dispatch(getTotalRevenue({ startDate, endDate }));
      dispatch(getRevenueByPeriod({ startDate, endDate, period }));
      dispatch(getTopProducts({ limit: 10, sortBy: 'revenue' }));
    }
  }, [dispatch, startDate, endDate, period]);

  useEffect(() => {
    if (!isAuthed) {
      navigate('/login');
      return;
    }

    dispatch(clearAnalytics());
    loadAnalytics();
  }, [dispatch, isAuthed, navigate, loadAnalytics]);

  const handleDateRangeChange = () => {
    loadAnalytics();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
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
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Analytics</h1>
        <p className="text-sm text-slate-600">Thống kê doanh thu và sản phẩm bán chạy</p>
      </div>

      {error && (
        <div className="rounded-2xl border bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>
      )}

      {/* Date Range Picker */}
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Chọn khoảng thời gian</div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Từ ngày</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-48"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Đến ngày</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-48"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Chu kỳ</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="h-10 w-32 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#ee4d2d] focus:ring-2 focus:ring-[#ee4d2d]/15"
              >
                <option value="daily">Theo ngày</option>
                <option value="weekly">Theo tuần</option>
                <option value="monthly">Theo tháng</option>
              </select>
            </div>
            <Button onClick={handleDateRangeChange} disabled={status === 'loading'}>
              Áp dụng
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Total Revenue Cards */}
      {status === 'loading' ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse rounded bg-slate-100" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : totalRevenue ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-[#ee4d2d]/15">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">Tổng doanh thu</div>
                  <div className="mt-2 text-2xl font-bold text-[#ee4d2d]">
                    {formatCurrency(totalRevenue.totalRevenue)}
                  </div>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#ee4d2d]/10">
                  <DollarSign className="h-6 w-6 text-[#ee4d2d]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">Tổng đơn hàng</div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {totalRevenue.totalOrders.toLocaleString('vi-VN')}
                  </div>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100">
                  <ShoppingCart className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">Giá trị đơn hàng TB</div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCurrency(totalRevenue.averageOrderValue)}
                  </div>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100">
                  <TrendingUp className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Revenue Chart (Simple Table) */}
      {revenueByPeriod.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-600" />
              <div className="text-sm font-semibold">Doanh thu theo {period === 'daily' ? 'ngày' : period === 'weekly' ? 'tuần' : 'tháng'}</div>
            </div>
          </CardHeader>
          <CardContent>
            {revenueStatus === 'loading' ? (
              <div className="py-8 text-center text-sm text-slate-600">Đang tải dữ liệu...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-semibold">Ngày</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Doanh thu</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Số đơn</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Giá trị TB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueByPeriod.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm">{formatDate(item.date)}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-[#ee4d2d]">
                          {formatCurrency(item.revenue)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">{item.orderCount}</td>
                        <td className="px-4 py-3 text-right text-sm">
                          {formatCurrency(item.averageOrderValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-slate-600" />
            <div className="text-sm font-semibold">Top sản phẩm bán chạy</div>
          </div>
        </CardHeader>
        <CardContent>
          {topProductsStatus === 'loading' ? (
            <div className="py-8 text-center text-sm text-slate-600">Đang tải sản phẩm...</div>
          ) : topProducts.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-600">Chưa có dữ liệu sản phẩm</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Sản phẩm</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Danh mục</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Số lượng bán</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Doanh thu</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Tỷ lệ chuyển đổi</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product) => (
                    <tr key={product.productId} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{product.productName}</div>
                        <div className="text-xs text-slate-500">{product.productId}</div>
                      </td>
                      <td className="px-4 py-3">
                        {product.category ? (
                          <Badge variant="secondary">{product.category}</Badge>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {product.salesCount.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-[#ee4d2d]">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {product.conversionRate !== undefined
                          ? `${product.conversionRate.toFixed(2)}%`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

